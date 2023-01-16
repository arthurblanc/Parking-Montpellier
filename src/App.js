import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareParking, faLocationArrow, faRotateRight, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faReact } from "@fortawesome/free-brands-svg-icons";

import Parking from "./components/Parking/index";
import Dropdown from "./components/Dropdown";

import extraData from "./utils/extradata";
import loading from "./assets/img/loading-car.min.gif";
import loadingDark from "./assets/img/loading-car-dark.min.gif";

import "./App.scss";

// Array of options for the sort dropdown
let options = [
	{
		label: "Nom (A-Z)",
		value: "nom",
		direction: "asc",
	},
	{
		label: "Nom (Z-A)",
		value: "nom",
		direction: "desc",
	},
	{
		label: "Places libres (croissant)",
		value: "realTimeFree",
		direction: "asc",
	},
	{
		label: "Places libres (décroissant)",
		value: "realTimeFree",
		direction: "desc",
	},
	{
		label: "Places totales (croissant)",
		value: "realTimeTotal",
		direction: "asc",
	},
	{
		label: "Places totales (décroissant)",
		value: "realTimeTotal",
		direction: "desc",
	},
	{
		label: "Pourcentage de place libre (croissant)",
		value: "realTimeFreePercentage",
		direction: "asc",
	},
	{
		label: "Pourcentage de place libre (décroissant)",
		value: "realTimeFreePercentage",
		direction: "desc",
	},
];

function App() {
	// State variables
	const [isLoading, setIsLoading] = useState(true);
	const [allParkingsData, setAllParkingsData] = useState([]);
	const [selectedSortOption, setSelectedSortOption] = useState(options[0]);
	const [isSortedByDistance, setIsSortedByDistance] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [userLatitude, setUserLatitude] = useState(null);
	const [userLongitude, setUserLongitude] = useState(null);
	const [userLocationError, setUserLocationError] = useState(null);
	const [darkMode, setDarkMode] = useState("");

	// useEffect hook to check the preferred color scheme of the user's device
	useEffect(() => {
		// get dark mode status from local storage
		const darkMode = JSON.parse(localStorage.getItem("Parking-Montpellier-DarkMode"));
		// check if the preferred color scheme of the device is dark
		if (darkMode === null) {
			if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
				setDarkMode(true);
			} else {
				setDarkMode(false);
			}
		} else {
			setDarkMode(darkMode);
		}
	}, []);

	// useEffect hook to apply the class to the body element to change the color scheme
	useEffect(() => {
		if (darkMode) {
			document.body.classList.remove("light");
			document.body.classList.add("dark");
		} else {
			document.body.classList.remove("dark");
			document.body.classList.add("light");
		}
	}, [darkMode]);

	// useEffect hook to fetch data when the component is loaded
	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async (bypassCache = false) => {
		// Set isLoading to true
		setIsLoading(true);
		// Set the cors proxy url
		const corsProxyUrl = process.env.REACT_APP_CORS_PROXY_URL;
		//const corsProxyUrl = "http://localhost:4000/";
		// Add api key for the cors proxy
		const corsProxyApiKey = process.env.REACT_APP_CORS_PROXY_API_KEY;
		// URL for geojson data
		const geoJsonUrl = "https://data.montpellier3m.fr/sites/default/files/ressources/VilleMTP_MTP_ParkingOuv.geojson";
		// URL for parking data
		const parkingUrl =
			"https://data.montpellier3m.fr/api/3/action/package_show?id=90e17b94-989f-4d66-83f4-766d4587bec2&utm_source=Site%20internet&utm_campaign=Clic%20sur%20%3A%20https%3A//data.montpellier3m.fr/api/3/action/package_show/90e17b94-989f-4d66-83f4-766d4587bec2&utm_term=https%3A//data.montpellier3m.fr/api/3/action/package_show/90e17b94-989f-4d66-83f4-766d4587bec2";

		try {
			// Set the headers for the request
			const headers = {
				"x-api-key": corsProxyApiKey,
				"cache-control": bypassCache ? "no-cache" : "",
			};
			// Send a GET request to the server to fetch geoJson data
			const geoJsonResponse = await fetch(`${corsProxyUrl}${geoJsonUrl}`, {
				headers,
			});
			const geoJson = await geoJsonResponse.json();
			// Send a GET request to the server to fetch parkingXML data
			const parkingXMLResponse = await fetch(`${corsProxyUrl}${parkingUrl}`, {
				headers,
			});
			const parkingXML = await parkingXMLResponse.json();
			//filter the parkingRealTimeData
			const parkingRealTimeData = parkingXML.result.resources.filter((item) => item.id !== "8d478025-4b42-4812-ac80-7a3543e165f7" && item.id !== "3daec4b2-cd07-448d-a9cd-ca18140ce566");
			// Use promise.all to send multiple async requests to the server in parallel
			const parkingRealTimePromises = parkingRealTimeData.map(async (item) => {
				try {
					// Fetch parking real time data for each parking
					const parkingXMLResponse = await fetch(`${corsProxyUrl}${item.url}`, {
						headers,
					});
					const xml = await parkingXMLResponse.text();
					const xmlDoc = new DOMParser().parseFromString(xml, "text/xml");
					// Get the free and total spots for the parking
					const free = parseInt(xmlDoc.getElementsByTagName("Free")[0].childNodes[0].nodeValue);
					const total = parseInt(xmlDoc.getElementsByTagName("Total")[0].childNodes[0].nodeValue);
					const dateTime = xmlDoc.getElementsByTagName("DateTime")[0].childNodes[0].nodeValue;
					const freePercentage = Math.round((free / total) * 100);
					// Calculate the time difference between now and the last update
					const timeDifference = Math.abs(new Date() - new Date(dateTime));
					const dayDifference = Math.ceil(timeDifference / (1000 * 60 * 60));
					const status = total < 1 ? "Close" : xmlDoc.getElementsByTagName("Status")[0].childNodes[0].nodeValue;
					const parkingRealTime = {
						name: item.name.replace(/^(Parking (du|des) )|^Parking /i, ""),
						fullName: item.name,
						status: dayDifference > 1 ? null : status,
						dateTime: dayDifference > 1 ? null : dateTime,
						free: dayDifference > 1 ? null : free,
						total: total,
						freePercentage: dayDifference > 1 ? null : freePercentage,
					};
					return parkingRealTime;
				} catch (error) {
					// Return null if there is an error fetching the parking real time data
					return null;
				}
			});

			// Wait for all the promises to resolve and store the result in formatedParkingRealTimeData
			const formatedParkingRealTimeData = await Promise.all(parkingRealTimePromises);
			// Filter out any null items from formatedParkingRealTimeData
			const allParkingRealTimeData = formatedParkingRealTimeData.filter((item) => item !== null);
			// Filter out the feature with id "34172_PEYROU" from the geoJsonData
			const geoJsonData = geoJson.features.filter((item) => item.properties.id !== "34172_PEYROU");

			let allParkingsData = geoJsonData.map((feature) => {
				if (!feature.properties.nom) {
					// If feature doesn't have a "nom" property, return null
					return null;
				}

				const { id } = feature.properties;
				const extraDataItem = extraData.find((item) => item.id === id);
				// Check if the current feature is in the favorites stored in Local Storage
				const favoritesParkings = JSON.parse(localStorage.getItem("Parking-Montpellier-Favorites") || "[]");
				const isFavorite = favoritesParkings.includes(id);
				// Find the matching parking real time data based on name
				const parkingRealTime = allParkingRealTimeData.find((item) => {
					const parkingName = feature.properties.nom.toLowerCase();
					const realTimeName = item.name.toLowerCase();
					// Check if the parking name or real time name contains the other name or if it's one of the specified cases
					return (
						realTimeName.includes(parkingName) ||
						parkingName.includes(realTimeName) ||
						(parkingName === "viccarello" && realTimeName === "vicarello") ||
						(parkingName === "saint roch" && realTimeName === "gare") ||
						(parkingName === "circé odysseum" && realTimeName === "circe") ||
						(parkingName === "saint-jean-le-sec" && realTimeName === "saint jean le sec")
					);
				});
				// Get the longitude and latitude from the feature properties or the geometry coordinates
				const { Xlong: userLongitude, Ylat: userLatitude, places_pub: publicPlaces, nb_places: totalPlaces } = feature.properties;

				// Return the data with the added properties
				return {
					...feature.properties,
					adresse: feature.properties.adresse.charAt(0).toUpperCase() + feature.properties.adresse.slice(1) || null,
					Xlong: userLongitude || feature.geometry.coordinates[0],
					Ylat: userLatitude || feature.geometry.coordinates[1],
					googleMapsLink: extraDataItem.googleMapsLink || null,
					googleMapsEmbedLink: extraDataItem.googleMapsEmbedLink || null,
					modName: extraDataItem.modName || null,
					isFavorite,
					realTimeName: parkingRealTime ? parkingRealTime.name : null,
					realTimeFullName: parkingRealTime ? parkingRealTime.fullName : null,
					realTimeStatus: parkingRealTime ? parkingRealTime.status : null,
					realTimeDateTime: parkingRealTime ? parkingRealTime.dateTime : null,
					realTimeFree: parkingRealTime ? parkingRealTime.free : null,
					realTimeTotal: parkingRealTime ? parkingRealTime.total : publicPlaces > 0 ? publicPlaces : totalPlaces,
					realTimeFreePercentage: parkingRealTime ? parkingRealTime.freePercentage : null,
				};
			});
			// Check if userLatitude and userLongitude are present
			if (userLatitude && userLongitude) {
				// If present, map over allParkingsData and add a new property "distance" with the distance value calculated using getDistance function
				allParkingsData = allParkingsData.map((parking) => {
					return { ...parking, distance: getDistance(userLatitude, userLongitude, parking.Ylat, parking.Xlong) };
				});
			}
			// Sort allParkingsData by ascending order of "nom" property
			sortBy(allParkingsData, "asc", "nom");
			// Set isLoading to false
			setIsLoading(false);
		} catch (error) {
			return null;
		}
	};

	const sortBy = (parkingArray, direction, key) => {
		// Find the selected option based on the given direction and key
		const selectedOption = options.find((option) => option.direction === direction && option.value === key);
		// set the selected sort option
		setSelectedSortOption(selectedOption);
		// set a boolean value indicating whether the data is sorted by distance or not
		setIsSortedByDistance(key === "distance" ? true : false);
		// sort the parking array based on the direction and key
		setAllParkingsData(
			[...parkingArray].sort((a, b) => {
				if (direction === "asc") {
					// sort in ascending order
					return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
				} else {
					// sort in descending order
					return a[key] > b[key] ? -1 : a[key] < b[key] ? 1 : 0;
				}
			})
		);
	};

	const handleSortOptionChange = (option) => {
		// call the sortBy function with the current parkings data, the option direction, and option value
		sortBy([...allParkingsData], option.direction, option.value);
	};

	const toggleFavorite = (id, add) => {
		// Retrieve an array of favorite parking IDs from local storage, or create a new one if it doesn't exist
		let favoritesParkings = JSON.parse(localStorage.getItem("Parking-Montpellier-Favorites")) || [];
		if (add) {
			// add the given id to the favorites list
			if (!favoritesParkings.includes(id)) {
				favoritesParkings.push(id);
			}
		} else {
			// remove the given id from the favorites list
			favoritesParkings = favoritesParkings.filter((favorite) => favorite !== id);
		}
		// update local storage with the new favorites list
		localStorage.setItem("Parking-Montpellier-Favorites", JSON.stringify(favoritesParkings));
		// update the state of the parking with the given id
		setAllParkingsData((prevState) =>
			prevState.map((parking) => {
				if (parking.id === id) {
					parking.isFavorite = add;
				}
				return parking;
			})
		);
	};

	const getDistance = (userLat, userLon, placeLat, placeLon) => {
		// convert degree to radians
		const toRadians = (deg) => deg * (Math.PI / 180);
		// convert userLat, placeLat, placeLat - userLat and placeLon - userLon to radians
		const [φ1, φ2, Δφ, Δλ] = [userLat, placeLat, placeLat - userLat, placeLon - userLon].map(toRadians);
		// Use Haversine formula to calculate distance between two points on Earth's surface
		const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
		// return distance in meters
		return 6371e3 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	};

	const getUserLocationAndSetParkingsDistance = () => {
		// set error message to null
		setUserLocationError(null);
		// define the new option for sorting by distance
		const newOption = { label: "Du plus proche au plus éloigné", value: "distance", direction: "asc" };
		// define error messages
		const errorMessages = {
			"User denied Geolocation": "L'utilisateur a refusé la géolocalisation",
			"User denied geolocation prompt": "L'utilisateur a refusé la géolocalisation",
			"Geolocation service failed.": "Le service de géolocalisation a échoué.",
			"Geolocation timed out.": "Le temps de géolocalisation a expiré.",
			"Geolocation is not supported by this browser.": "La géolocalisation n'est pas supportée par ce navigateur.",
		};
		// check if geolocation is supported by the browser
		if (navigator.geolocation) {
			// use the browser's geolocation API to get the user's current location
			navigator.geolocation.getCurrentPosition(
				(position) => {
					// set the user's latitude and longitude
					setUserLatitude(position.coords.latitude);
					setUserLongitude(position.coords.longitude);
					// calculate the distance between the user's location and each parking location
					const parkingWithDistance = allParkingsData.map((parking) => {
						return { ...parking, distance: getDistance(position.coords.latitude, position.coords.longitude, parking.Ylat, parking.Xlong) };
					});
					// add the new option for sorting by distance if it doesn't already exist
					if (!options.some((option) => option.value === newOption.value)) {
						options.push(newOption);
					}
					// sort the parking data by distance
					sortBy(parkingWithDistance, "asc", "distance");
				},
				(error) => {
					// set an error message based on the error received
					setUserLocationError(errorMessages[error.message] || "Erreur inconnue");
				}
			);
		} else {
			// set an error message if geolocation is not supported by the browser
			setUserLocationError(errorMessages["Geolocation is not supported by this browser."]);
		}
	};

	const toggleDarkMode = () => {
		// toggle dark mode in local storage
		localStorage.setItem("Parking-Montpellier-DarkMode", JSON.stringify(!darkMode));
		// toggle dark mode state
		setDarkMode((prevState) => !prevState);
	};

	const renderParkingLists = (data, filterFn, searchInput, titleSingular, titlePlural = titleSingular) => {
		// filter the data based on the filter function
		const filteredData = data.filter((parking) => parking && filterFn(parking.realTimeStatus, parking.isFavorite));
		// return null if there are no filtered data
		if (!filteredData.length) return null;
		// filter the data based on the search input
		const filteredWithSearch = filteredData.filter(
			(parking) => parking.nom.toLowerCase().includes(searchInput.toLowerCase()) || (parking.modName && parking.modName.toLowerCase().includes(searchInput.toLowerCase()))
		);
		// create a list of parking cards
		const parkingCards = filteredWithSearch.map((parking) => <Parking key={parking.id} parking={parking} toggleFavorite={toggleFavorite} />);
		// render the parking list
		return (
			<>
				<h2 className="list__title">{filteredData.length > 1 ? titlePlural : titleSingular}</h2>
				<div className={!parkingCards.length ? "list__card-wrapper--empty" : "list__card-wrapper"}>
					{!parkingCards.length ? <p className="list__no-parking">Aucun parking ne correspond à votre recherche</p> : parkingCards}
				</div>
			</>
		);
	};

	return (
		<div className="main">
			<h1 className="header">
				<FontAwesomeIcon icon={faSquareParking} className="header-icon" />
				arking Montpellier
			</h1>

			{isLoading ? (
				<img className="loading-car" src={darkMode ? loadingDark : loading} alt="Loading" />
			) : (
				<>
					<input className="search-bar" type="text" placeholder="Rechercher un parking" onChange={(e) => setSearchInput(e.target.value)} />

					<Dropdown label={"Trier par : "} options={options} selected={selectedSortOption} onSelectedChange={handleSortOptionChange} />

					{!userLatitude && !userLongitude && (
						<>
							<button className="button location-button" onClick={getUserLocationAndSetParkingsDistance}>
								<FontAwesomeIcon icon={faLocationArrow} style={{ marginRight: "1rem" }} />
								Ajouter la distance aux parkings
							</button>
							{userLocationError && <p className="location-error">Erreur: {userLocationError}</p>}
						</>
					)}

					<button className="button" onClick={() => fetchData(true)}>
						<FontAwesomeIcon icon={faRotateRight} style={{ marginRight: "1rem" }} />
						Actualiser les données
					</button>

					<main>
						{isSortedByDistance ? (
							renderParkingLists(allParkingsData, () => true, searchInput, "Parking", "Parkings du plus proche au plus éloigné")
						) : (
							<>
								{renderParkingLists(allParkingsData, (status, isFavorite) => isFavorite === true, searchInput, "Parking favori", "Parkings favoris")}
								{renderParkingLists(allParkingsData, (status, isFavorite) => status === "Open" && isFavorite === false, searchInput, "Parking en direct", "Parkings en direct")}
								{renderParkingLists(allParkingsData, (status, isFavorite) => status === null && isFavorite === false, searchInput, "Autre parking", "Autres parkings")}
								{renderParkingLists(
									allParkingsData,
									(status, isFavorite) => status !== "Open" && status !== null && isFavorite === false,
									searchInput,
									"Parking fermé ou complet",
									"Parkings fermés ou complets"
								)}
							</>
						)}
					</main>
					<footer className="footer">
						<p className="footer__text">
							Made by Arthur BLANC{" "}
							<a href="https://github.com/ArthurBlanc" target="_blank" rel="noopener noreferrer" className="footer__link" alt="github">
								<FontAwesomeIcon icon={faGithub} />
							</a>{" "}
							with ReactJS <FontAwesomeIcon icon={faReact} /> — Theme :{" "}
							<button className="footer__toggle-btn" onClick={toggleDarkMode}>
								<FontAwesomeIcon className="icon" icon={darkMode ? faMoon : faSun} />
							</button>
						</p>
						<p className="footer__text">
							Data from{" "}
							<a href="https://data.montpellier3m.fr/" target="_blank" rel="noopener noreferrer" className="footer__link" alt="Open Data Montpellier Website">
								Open Data Montpellier Méditerranée Métropole
							</a>
						</p>
					</footer>
				</>
			)}
		</div>
	);
}

export default App;

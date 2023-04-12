import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareParking, faLocationArrow, faRotateRight, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faReact } from "@fortawesome/free-brands-svg-icons";

import Parking from "./components/Parking";
import Dropdown from "./components/Dropdown";

import extraData from "./utils/extradata";
import loading from "./assets/img/loading-car.min.gif";
import loadingDark from "./assets/img/loading-car-dark.min.gif";

import "./App.scss";

// Array of options for the sort dropdown
let options = [
	{
		label: "Nom (A-Z)",
		value: "name",
		direction: "asc",
	},
	{
		label: "Nom (Z-A)",
		value: "name",
		direction: "desc",
	},
	{
		label: "Places libres (croissant)",
		value: ["realTimeData", "availableSpotNumber"],
		direction: "asc",
	},
	{
		label: "Places libres (décroissant)",
		value: ["realTimeData", "availableSpotNumber"],
		direction: "desc",
	},
	{
		label: "Places totales (croissant)",
		value: ["realTimeData", "totalSpotNumber"],
		direction: "asc",
	},
	{
		label: "Places totales (décroissant)",
		value: ["realTimeData", "totalSpotNumber"],
		direction: "desc",
	},
	{
		label: "Pourcentage de place libre (croissant)",
		value: ["realTimeData", "availableSpotPercentage"],
		direction: "asc",
	},
	{
		label: "Pourcentage de place libre (décroissant)",
		value: ["realTimeData", "availableSpotPercentage"],
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

	const fetchData = async () => {
		// Set isLoading to true
		setIsLoading(true);
		// URL for offstreetParking data
		const offstreetParkingUrl = "https://portail-api-data.montpellier3m.fr/offstreetparking?limit=1000";
		// URL for parkingSpaces data
		const parkingSpacesUrl = "https://portail-api-data.montpellier3m.fr/parkingspaces?limit=1000";

		try {
			// Fetch data from the offstreet parking and parking spaces API endpoints
			const [offstreetParkingRes, parkingSpacesRes] = await Promise.all([fetch(offstreetParkingUrl), fetch(parkingSpacesUrl)]);
			// Parse the response data from the API endpoints
			const [offstreetParkingData, parkingSpacesData] = await Promise.all([offstreetParkingRes.json(), parkingSpacesRes.json()]);

			// Transform the offstreet parking data by adding additional properties
			const offstreetParkingArray = offstreetParkingData?.map((parking) => {
				// Calculate the percentage of free spots in the parking lot
				const freePercentage = Math.round((parking.availableSpotNumber.value / parking.totalSpotNumber.value) * 100);
				// Determine the status of the parking based on the number of available spots
				const status = parking.availableSpotNumber.value < 1 ? "Close" : parking.status.value;

				// Calculate the UTC date of the last status update for the parking lot
				const PARIS_TIMEZONE_OFFSET = 120; // Time difference between Paris and UTC in minutes
				const date = new Date(parking.status.metadata.timestamp.value);
				const utcDate = new Date(date.getTime() - PARIS_TIMEZONE_OFFSET * 60 * 1000);

				// Add the calculated properties to the parking object
				return {
					...parking,
					availableSpotPercentage: { type: "Number", value: freePercentage, metadata: {} },
					status: { type: "text", value: status, metadata: { ...parking.status.metadata } },
					isLastUpdateLessThanOneHour: {
						type: "Boolean",
						value: utcDate > Date.now() - 3600000,
						metadata: { ...parking.status.metadata },
					},
				};
			});

			// Retrieve the favorites parking from local storage or an empty array
			const favoritesParkings = JSON.parse(localStorage.getItem("Parking-Montpellier-Favorites") || "[]");

			// Function to find and return an off-street parking object that matches a given parking object based on different criteria
			const getOffstreetParking = (parking, offstreetParkingArray) => {
				// Find an off-street parking that matches the given parking's longitude and latitude or its ID, or that has a similar name as the parking
				const foundParking = offstreetParkingArray.find(
					(offstreetParking) =>
						(offstreetParking.location.value.coordinates[0] === +parking.longitude.value && offstreetParking.location.value.coordinates[1] === +parking.latitude.value) ||
						(offstreetParking.id === "urn:ngsi-ld:parking:008" && parking.id === "urn:ngsi-ld:ParkingSpace:34172_SAINTRO") ||
						(offstreetParking.id === "urn:ngsi-ld:parking:019" && parking.id === "urn:ngsi-ld:ParkingSpace:34057_VICCAR") ||
						offstreetParking.name.value.toLowerCase().includes(parking.name.value.toLowerCase()) ||
						parking.name.value.toLowerCase().includes(offstreetParking.name.value.toLowerCase())
				);
				// Return the found off-street parking or null
				return foundParking;
			};

			// Filter out a specific parking ID from the parking spaces data and store it in a new variable
			const filteredParkingData = parkingSpacesData.filter((item) => item.id !== "urn:ngsi-ld:ParkingSpace:34172_PEYROU");

			// Map over the filtered parking spaces data to add some properties to each parking object and return a new merged parking data array
			let mergedParkingData = filteredParkingData.map((parking) => {
				// Get an off-street parking object that matches the current parking object or create a fake one with some default values
				const offstreetParking = getOffstreetParking(parking, offstreetParkingArray);
				// Check if the current parking is a favorite or not
				const isFavorite = favoritesParkings.includes(parking.id);
				// If an off-street parking object is found, use its data as real-time data for the current parking object, otherwise create fake real-time data
				const realTimeData = offstreetParking
					? offstreetParking
					: {
							status: { value: null, metadata: {} },
							availableSpotNumber: { value: null },
							totalSpotNumber: { value: parking.parkingSpaceNumber.value },
							availableSpotPercentage: { value: null },
							isLastUpdateLessThanOneHour: { value: false },
					  };
				// Set the Xlong and Ylat properties of the current parking object to the ones from the found off-street parking object or the original parking object
				const Xlong = offstreetParking ? offstreetParking.location.value.coordinates[0] : parking.longitude.value;
				const Ylat = offstreetParking ? offstreetParking.location.value.coordinates[1] : parking.latitude.value;
				// Find the extraData object that matches the parking id, if any, and add it to the current parking object as a new property
				const matchingExtraData = extraData.find((data) => data.id === parking.id);

				return {
					...parking,
					Xlong,
					Ylat,
					isFavorite,
					realTimeData,
					...(matchingExtraData && { extraData: matchingExtraData }),
				};
			});

			// Check if userLatitude and userLongitude are present
			if (userLatitude && userLongitude) {
				// Map over the mergedParkingData array and add a new "distance" property to each object
				const updatedParkingData = mergedParkingData.map((parking) => {
					// Calculate the distance between user's location and parking's location using the getDistance function
					const distance = { type: "Number", value: getDistance(userLatitude, userLongitude, parking.Ylat, parking.Xlong), metadata: {} };
					// Return the updated parking object with the new "distance" property
					return { ...parking, distance };
				});
				// Update mergedParkingData with the new distance values
				mergedParkingData = updatedParkingData;
			}
			// Sort mergedParkingData by ascending order of "name" property using the sortBy function
			sortBy(mergedParkingData, "asc", "name");

			// Set isLoading to false to indicate that the data has finished loading
			setIsLoading(false);
		} catch (error) {
			return null;
		}
	};

	const sortBy = (parkingArray, direction, key) => {
		// Find the selected option based on the given direction and key
		const selectedOption = options.find((option) => option.direction === direction && option.value === key);
		// Set the selected sort option
		setSelectedSortOption(selectedOption);
		// Set a boolean value indicating whether the data is sorted by distance or not
		setIsSortedByDistance(key === "distance" ? true : false);
		// Sort the parking array based on the direction and key
		const sortByKey = (arr, key, direction) => {
			// Create a copy of the array to avoid modifying the original data
			const sortedArr = [...arr].sort((a, b) => {
				// Determine the compare value based on the direction
				const compareValue = direction === "asc" ? 1 : -1;

				if (typeof key === "string") {
					// If the key is a string, compare the values of the corresponding properties
					const keyValA = /^\d+$/.test(a[key].value) ? Number(a[key].value) : a[key].value;
					const keyValB = /^\d+$/.test(b[key].value) ? Number(b[key].value) : b[key].value;
					return keyValA.localeCompare(keyValB) * compareValue;
				} else if (Array.isArray(key)) {
					// If the key is an array, compare the values of the nested properties
					const [firstKey, secondKey] = key;
					const keyValA = /^\d+$/.test(a[firstKey][secondKey].value) ? Number(a[firstKey][secondKey].value) : a[firstKey][secondKey].value;
					const keyValB = /^\d+$/.test(b[firstKey][secondKey].value) ? Number(b[firstKey][secondKey].value) : b[firstKey][secondKey].value;
					return (keyValA - keyValB) * compareValue;
				}
			});
			return sortedArr;
		};
		// Update the state of the parking data with the sorted data
		setAllParkingsData(sortByKey(parkingArray, key, direction));
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
						return { ...parking, distance: { type: "Number", value: getDistance(position.coords.latitude, position.coords.longitude, parking.Ylat, parking.Xlong), metadata: {} } };
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
		const filteredData = data.filter((parking) => parking && filterFn(parking.isFavorite, parking.realTimeData?.status.value, parking.realTimeData?.isLastUpdateLessThanOneHour.value));
		// return null if there are no filtered data
		if (!filteredData.length) return null;
		// filter the data based on the search input
		const filteredWithSearch = filteredData.filter(
			(parking) => parking.name.value.toLowerCase().includes(searchInput.toLowerCase()) || (parking.extraData.modName && parking.extraData.modName.toLowerCase().includes(searchInput.toLowerCase()))
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

					<button className="button" onClick={fetchData}>
						<FontAwesomeIcon icon={faRotateRight} style={{ marginRight: "1rem" }} />
						Actualiser les données
					</button>

					<main>
						{isSortedByDistance ? (
							renderParkingLists(allParkingsData, () => true, searchInput, "Parking", "Parkings du plus proche au plus éloigné")
						) : (
							<>
								{renderParkingLists(allParkingsData, (isFavorite, status, isLastUpdateLessThanOneHour) => isFavorite === true, searchInput, "Parking favori", "Parkings favoris")}

								{renderParkingLists(
									allParkingsData,
									(isFavorite, status, isLastUpdateLessThanOneHour) => isFavorite === false && status === "Open" && isLastUpdateLessThanOneHour === true,
									searchInput,
									"Parking en direct",
									"Parkings en direct"
								)}
								{renderParkingLists(
									allParkingsData,
									(isFavorite, status, isLastUpdateLessThanOneHour) => isFavorite === false && (status === null || status === "Open") && isLastUpdateLessThanOneHour === false,
									searchInput,
									"Autre parking",
									"Autres parkings"
								)}
								{renderParkingLists(
									allParkingsData,
									(isFavorite, status, isLastUpdateLessThanOneHour) => isFavorite === false && status !== "Open" && status !== null,
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

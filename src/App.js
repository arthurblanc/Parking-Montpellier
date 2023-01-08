import { useEffect, useState } from "react";
import "./App.scss";

import Parking from "./components/Parking/index";
import Dropdown from "./components/Dropdown";

import extraData from "./utils/extradata";

import loading from "./assets/img/loading-car.gif";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareParking, faLocationArrow } from "@fortawesome/free-solid-svg-icons";

const errorMessages = {
	"User denied Geolocation": "L'utilisateur a refusé la géolocalisation",
	"User denied geolocation prompt": "L'utilisateur a refusé la géolocalisation",
	"Geolocation service failed.": "Le service de géolocalisation a échoué.",
	"Geolocation timed out.": "Le temps de géolocalisation a expiré.",
	"Geolocation is not supported by this browser.": "La géolocalisation n'est pas supportée par ce navigateur.",
};

let options = [
	{
		label: "Nom (A-Z)",
		value: "asc-nom",
	},
	{
		label: "Nom (Z-A)",
		value: "desc-nom",
	},
	{
		label: "Places libres (croissant)",
		value: "asc-realTimeFree",
	},
	{
		label: "Places libres (décroissant)",
		value: "desc-realTimeFree",
	},
	{
		label: "Places totales (croissant)",
		value: "asc-realTimeTotal",
	},
	{
		label: "Places totales (décroissant)",
		value: "desc-realTimeTotal",
	},
	{
		label: "Pourcentage de place libre (croissant)",
		value: "asc-realTimeMedium",
	},
	{
		label: "Pourcentage de place libre (décroissant)",
		value: "desc-realTimeMedium",
	},
];

function App() {
	const [parkingWithLocation, setParkingWithLocation] = useState([]);
	const [search, setSearch] = useState("");
	const [selectedOption, setSelectedOption] = useState(options[0]);
	const [latitude, setLatitude] = useState(null);
	const [longitude, setLongitude] = useState(null);
	const [error, setError] = useState(null);
	const [isSortedByDistance, setIsSortedByDistance] = useState(false);

	const sortBy = (parkingArray, order, key) => {
		return [...parkingArray].sort((a, b) => {
			if (order === "asc") {
				return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
			} else {
				return a[key] > b[key] ? -1 : a[key] < b[key] ? 1 : 0;
			}
		});
	};

	useEffect(() => {
		console.log(parkingWithLocation);
	}, [parkingWithLocation]);

	async function fetchData() {
		const corsProxy = "https://corsproxy.io/?";
		const parkingUrl =
			"https://data.montpellier3m.fr/api/3/action/package_show?id=90e17b94-989f-4d66-83f4-766d4587bec2&utm_source=Site%20internet&utm_campaign=Clic%20sur%20%3A%20https%3A//data.montpellier3m.fr/api/3/action/package_show/90e17b94-989f-4d66-83f4-766d4587bec2&utm_term=https%3A//data.montpellier3m.fr/api/3/action/package_show/90e17b94-989f-4d66-83f4-766d4587bec2";
		const geoJsonUrl = "https://data.montpellier3m.fr/sites/default/files/ressources/VilleMTP_MTP_ParkingOuv.geojson";

		try {
			const response = await fetch(`${corsProxy}${parkingUrl}`);
			const parkingXML = await response.json();

			// Fetch the data for each parking resource
			const parkingData = parkingXML.result.resources.filter((item) => item.id !== "8d478025-4b42-4812-ac80-7a3543e165f7" && item.id !== "3daec4b2-cd07-448d-a9cd-ca18140ce566");
			const parkingPromises = parkingData.map(async (item) => {
				try {
					const response = await fetch(`${corsProxy}${item.url}`);
					const xml = await response.text();
					const xmlDoc = new DOMParser().parseFromString(xml, "text/xml");
					const free = parseInt(xmlDoc.getElementsByTagName("Free")[0].childNodes[0].nodeValue);
					const total = parseInt(xmlDoc.getElementsByTagName("Total")[0].childNodes[0].nodeValue);
					const dateTime = xmlDoc.getElementsByTagName("DateTime")[0].childNodes[0].nodeValue;
					const medium = Math.round((free / total) * 100);
					const dateTimeConvert = new Date(dateTime);
					const now = new Date();
					const diffTime = Math.abs(now - dateTimeConvert);
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60));
					const status = total < 1 ? "Close" : xmlDoc.getElementsByTagName("Status")[0].childNodes[0].nodeValue;
					const parking = {
						name: item.name.replace(/^(Parking (du|des) )|^Parking /i, ""),
						fullName: item.name,
						status: diffDays > 1 ? null : status,
						dateTime: diffDays > 1 ? null : dateTime,
						free: diffDays > 1 ? null : free,
						total: total,
						medium: diffDays > 1 ? null : medium,
					};
					return parking;
				} catch (error) {
					return null;
				}
			});

			// Wait for all parking data requests to complete
			const parkingDataB = await Promise.all(parkingPromises);

			// get the data from the previous request
			const allParkingData = parkingDataB.filter((item) => item !== null);

			// Fetch the geoJSON data
			const geoJsonResponse = await fetch(`${corsProxy}${geoJsonUrl}`);
			const geoJson = await geoJsonResponse.json();

			// Merge the parking data and geoJSON data
			const arrayGeoJson = geoJson.features.filter((item) => item.properties.id !== "34172_PEYROU");

			const parkingWithLocation = arrayGeoJson.map((feature) => {
				if (!feature.properties.nom) {
					console.log("test");
					return null;
				}

				const { id } = feature.properties;

				const extraDataItem = extraData.find((item) => item.id === id);

				//const isFavorite = JSON.parse(localStorage.getItem("favorites") || []).includes(id);
				const getFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
				const isFavorite = getFavorites.includes(id);

				const parking = allParkingData.find((item) => {
					const featureName = feature.properties.nom.toLowerCase();
					const itemName = item.name.toLowerCase();
					return (
						itemName.includes(featureName) ||
						featureName.includes(itemName) ||
						(featureName === "viccarello" && itemName === "vicarello") ||
						(featureName === "saint roch" && itemName === "gare") ||
						(featureName === "circé odysseum" && itemName === "circe") ||
						(featureName === "saint-jean-le-sec" && itemName === "saint jean le sec")
					);
				});

				const { Xlong: longitude, Ylat: latitude, places_pub: publicPlaces, nb_places: totalPlaces } = feature.properties;

				return {
					...feature.properties,
					Xlong: longitude || feature.geometry.coordinates[0],
					Ylat: latitude || feature.geometry.coordinates[1],
					googleMapsLink: extraDataItem.googleMapsLink || null,
					modName: extraDataItem.modName || null,
					isFavorite,
					realTimeName: parking ? parking.name : null,
					realTimeFullName: parking ? parking.fullName : null,
					realTimeStatus: parking ? parking.status : null,
					realTimeDateTime: parking ? parking.dateTime : null,
					realTimeFree: parking ? parking.free : null,
					realTimeTotal: parking ? parking.total : publicPlaces > 0 ? publicPlaces : totalPlaces,
					realTimeMedium: parking ? parking.medium : null,
				};
			});

			setParkingWithLocation(sortBy(parkingWithLocation, "asc", "nom"));
		} catch (error) {
			return null;
		}
	}

	useEffect(() => {
		fetchData();
	}, []);

	const handleOptionChange = (event) => {
		setSelectedOption(event);
		setIsSortedByDistance(event.value === "asc-distance" || event.value === "desc-distance");

		const key = event.value.split("-")[1];
		const direction = event.value.split("-")[0];
		const sortedArr = sortBy([...parkingWithLocation], direction, key);
		console.log(sortedArr);
		setParkingWithLocation(sortedArr);
	};

	const toggleFavorite = (id, add) => {
		let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
		if (add) {
			if (!favorites.includes(id)) {
				favorites.push(id);
			}
		} else {
			favorites = favorites.filter((favorite) => favorite !== id);
		}
		localStorage.setItem("favorites", JSON.stringify(favorites));
		setParkingWithLocation((prevState) =>
			prevState.map((parking) => {
				if (parking.id === id) {
					parking.isFavorite = add;
				}
				return parking;
			})
		);
	};

	const getLocation = () => {
		setError(null);
		const newOption = { label: "Du plus proche au plus éloigné", value: "asc-distance" };
		let parkingWithDistance;

		if (latitude && longitude) {
			setIsSortedByDistance(true);
			setParkingWithLocation(sortBy(parkingWithLocation, "asc", "distance"));
			setSelectedOption(newOption);
		} else if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setLatitude(position.coords.latitude);
					setLongitude(position.coords.longitude);

					parkingWithDistance = parkingWithLocation.map((parking) => {
						const userLat = position.coords.latitude;
						const userLon = position.coords.longitude;
						const distance = Math.floor(getDistance(userLat, userLon, parking.Ylat, parking.Xlong));

						return { ...parking, distance: distance };
					});

					const isOptionAlreadyInArray = options.some((option) => option.value === newOption.value);
					if (!isOptionAlreadyInArray) {
						options.push(newOption);
					}

					setSelectedOption(newOption);
					setIsSortedByDistance(true);
					setParkingWithLocation(sortBy(parkingWithDistance, "asc", "distance"));
				},
				(error) => {
					setLatitude(null);
					setLongitude(null);
					setError(errorMessages[error.message] || "Erreur inconnue");
				}
			);
		} else {
			setLatitude(null);
			setLongitude(null);
			setError(errorMessages["Geolocation is not supported by this browser."]);
		}
	};

	function getDistance(userLat, userLon, placeLat, placeLon) {
		const R = 6371e3;
		const toRadians = (deg) => deg * (Math.PI / 180);
		const [φ1, φ2, Δφ, Δλ] = [userLat, placeLat, placeLat - userLat, placeLon - userLon].map(toRadians);
		const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	function renderList(data, filterFn, title, search) {
		const filteredData = data
			.filter((parking) => parking && filterFn(parking.realTimeStatus, parking.isFavorite))
			.filter((parking) => parking.nom.toLowerCase().includes(search.toLowerCase()) || (parking.modName && parking.modName.toLowerCase().includes(search.toLowerCase())));
		if (!filteredData.length) return null;
		const parkingCards = filteredData.map((parking) => <Parking key={parking.id} parking={parking} toggleFavorite={toggleFavorite} />);
		return (
			<>
				<h2>{title}</h2>
				<div className="card-wrapper">{!parkingCards.length ? <p className="no-parking">Aucun parking ne correspond à votre recherche</p> : parkingCards}</div>
			</>
		);
	}

	return (
		<main className="main">
			<h1>
				<FontAwesomeIcon icon={faSquareParking} style={{ fontSize: "3rem", color: "#00008B" }} />
				arking Montpellier
			</h1>

			{!parkingWithLocation || parkingWithLocation.length === 0 ? (
				<img className="loading-car" src={loading} alt="Loading" />
			) : (
				<>
					<input className="search-bar" type="text" placeholder="Rechercher un parking" onChange={(e) => setSearch(e.target.value)} />

					<Dropdown label={"Trier par : "} options={options} selected={selectedOption} onSelectedChange={handleOptionChange} />

					<button className="location-button" onClick={getLocation}>
						Trier par distance <FontAwesomeIcon icon={faLocationArrow} />
					</button>
					<div className="location-info">{error && <p className="error">Erreur: {error}</p>}</div>

					{isSortedByDistance ? (
						renderList(parkingWithLocation, () => true, "Parkings du plus proche au plus éloigné", search)
					) : (
						<>
							{renderList(parkingWithLocation, (status, isFavorite) => isFavorite === true, "Parking(s) favori(s)", search)}
							{renderList(parkingWithLocation, (status, isFavorite) => status === "Open" && isFavorite === false, "Parkings en direct", search)}
							{renderList(parkingWithLocation, (status, isFavorite) => status === null && isFavorite === false, "Autres parkings", search)}
							{renderList(parkingWithLocation, (status, isFavorite) => status !== "Open" && status !== null && isFavorite === false, "Parkings fermés ou complets", search)}
						</>
					)}
				</>
			)}
		</main>
	);
}

export default App;

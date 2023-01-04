import { useEffect, useState } from "react";
import "./App.css";
import Parking from "./components/Parking/index";

function App() {
	const [parkingWithLocation, setParkingWithLocation] = useState([]);

	useEffect(() => {
		const parkingUrl =
			"https://data.montpellier3m.fr/api/3/action/package_show?id=90e17b94-989f-4d66-83f4-766d4587bec2&utm_source=Site%20internet&utm_campaign=Clic%20sur%20%3A%20https%3A//data.montpellier3m.fr/api/3/action/package_show/90e17b94-989f-4d66-83f4-766d4587bec2&utm_term=https%3A//data.montpellier3m.fr/api/3/action/package_show/90e17b94-989f-4d66-83f4-766d4587bec2";
		const geoJsonUrl = "https://data.montpellier3m.fr/sites/default/files/ressources/VilleMTP_MTP_ParkingOuv.geojson";
		function fetchGeoJson() {
			return fetch(geoJsonUrl)
				.then((response) => response.json())
				.then((geoJson) => {
					console.log(geoJson);
					return geoJson;
				})
				.catch((error) => {
					console.log(error);
				});
		}

		function fetchParkingXML() {
			return fetch(parkingUrl)
				.then((response) => response.json())
				.then((parkingXML) => {
					return parkingXML;
				})
				.catch((error) => {
					console.log(error);
				});
		}

		function fetchParkingData(parkingXML) {
			const parkingData = parkingXML.result.resources.filter((item) => item.id !== "8d478025-4b42-4812-ac80-7a3543e165f7" && item.id !== "3daec4b2-cd07-448d-a9cd-ca18140ce566");
			console.log(parkingXML);
			const parkingPromises = parkingData.map((item) => {
				return fetch(item.url)
					.then((response) => response.text())
					.then((xml) => {
						if (xml !== "") {
							const parser = new DOMParser();
							const xmlDoc = parser.parseFromString(xml, "text/xml");
							const parking = {
								//id: item.id,
								name: item.name.replace(/^(Parking (du|des) )|^Parking /i, ""),
								status: xmlDoc.getElementsByTagName("Status")[0].childNodes[0].nodeValue,
								dateTime: xmlDoc.getElementsByTagName("DateTime")[0].childNodes[0].nodeValue,
								free: xmlDoc.getElementsByTagName("Free")[0].childNodes[0].nodeValue.replace(/^0+/, ""),
								total: xmlDoc.getElementsByTagName("Total")[0].childNodes[0].nodeValue.replace(/^0+/, ""),
							};
							return parking;
						}
						return null;
					})
					.catch((error) => {
						console.log(error);
					});
			});
			return Promise.all(parkingPromises).then((parkingData) => parkingData.filter((item) => item !== null));
		}

		function mergeData(allParkingData, geoJson) {
			let parkingWithLocation = geoJson.features.map((feature) => {
				if (feature.properties.nom) {
					let parking = allParkingData.find(
						(item) =>
							item.name.toLowerCase().includes(feature.properties.nom.toLowerCase()) ||
							feature.properties.nom.toLowerCase().includes(item.name.toLowerCase()) ||
							(feature.properties.nom === "Viccarello" && item.name === "Vicarello") ||
							(feature.properties.nom === "Saint Roch" && item.name === "Gare ") ||
							(feature.properties.nom === "Circé Odysseum" && item.name === "Circe") ||
							(feature.properties.nom === "Saint-Jean-le-Sec" && item.name === "Saint Jean Le Sec")
					);
					if (parking) {
						return {
							...feature.properties,

							realTime: parking,
						};
					} else {
						return {
							...feature.properties,
							realTime: {
								status: "Inconnu",
								free: "Inconnu",
								total: feature.properties.places_pub > 0 && feature.properties.places_pub ? feature.properties.places_pub : feature.properties.nb_places,
								dateTime: null,
							},
						};
					}
				}
				return null;
			});

			parkingWithLocation = parkingWithLocation.map((item) => {
				if (item) {
					const dateTime = new Date(item.realTime.dateTime);
					const now = new Date();
					const diffTime = Math.abs(now - dateTime);
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60));
					if (item.realTime.total === "0" || item.realTime.total === 0) {
						item.realTime.status = "Close";
					} else if (diffDays > 1) {
						item.realTime.status = "Inconnu";
						item.realTime.free = "Inconnu";
						item.realTime.dateTime = "Inconnu";
					}
					return item;
				}
				return null;
			});

			// sort by name
			parkingWithLocation = parkingWithLocation.sort((a, b) => {
				if (a.nom < b.nom) {
					return -1;
				}
				if (a.nom > b.nom) {
					return 1;
				}
				return 0;
			});

			// sort by status (first open, last closed)
			parkingWithLocation = parkingWithLocation.sort((a, b) => {
				if (a.realTime.status === "Open" && b.realTime.status !== "Open") {
					return -1;
				}
				if (a.realTime.status !== "Open" && b.realTime.status === "Open") {
					return 1;
				}
				return 0;
			});
			console.log(parkingWithLocation);
			setParkingWithLocation(parkingWithLocation);
		}

		function run() {
			fetchGeoJson()
				.then((geoJson) => {
					return fetchParkingXML().then((parkingXML) => [geoJson, parkingXML]);
				})
				.then(([geoJson, parkingXML]) => {
					return fetchParkingData(parkingXML).then((allParkingData) => [allParkingData, geoJson]);
				})
				.then(([allParkingData, geoJson]) => {
					mergeData(allParkingData, geoJson);
				})
				.catch((error) => {
					console.log(error);
				});
		}
		run();
	}, []);

	return (
		<div>
			<h1>Parking Montpellier</h1>

			<h2>Parkings ouverts (avec données en temps réel)</h2>

			<div className="main">{parkingWithLocation.map((parking) => parking && parking.realTime.status === "Open" && <Parking key={parking.id} parking={parking} name={parking.name} />)}</div>

			<h2>Autres parkings (sans données en temps réel)</h2>

			<div className="main">{parkingWithLocation.map((parking) => parking && parking.realTime.status === "Inconnu" && <Parking key={parking.id} parking={parking} name={parking.name} />)}</div>

			<h2>Parkings fermés</h2>

			<div className="main">
				{parkingWithLocation.map((parking) => parking && parking.realTime.status !== "Open" && parking.realTime.status !== "Inconnu" && <Parking key={parking.id} parking={parking} name={parking.name} />)}
			</div>
		</div>
	);
}

export default App;

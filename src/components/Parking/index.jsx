import { useState } from "react";
import "./index.css";

function Parking({ parking }) {
	const [isOpen, setIsOpen] = useState(false);

	function toHumanReadable(dateString) {
		// Parse the date string into a Date object
		const date = new Date(dateString);

		// Get the current time
		const now = new Date();

		// Calculate the difference in milliseconds
		const diff = now - date;

		// Convert the difference to minutes, hours, or days
		let timeUnit;
		let timeAmount;
		if (diff < 1000 * 60) {
			// Less than 1 minute
			timeUnit = "seconds";
			timeAmount = Math.round(diff / 1000);
		} else if (diff < 1000 * 60 * 60) {
			// Less than 1 hour
			timeUnit = "minutes";
			timeAmount = Math.round(diff / 1000 / 60);
		} else if (diff < 1000 * 60 * 60 * 24) {
			// Less than 1 day
			timeUnit = "hours";
			timeAmount = Math.round(diff / 1000 / 60 / 60);
		} else {
			// 1 day or more
			timeUnit = "days";
			timeAmount = Math.round(diff / 1000 / 60 / 60 / 24);
		}

		// Return the human-readable string
		return `${timeAmount} ${timeUnit} ago`;
	}

	function replaceUnderscores(str) {
		// Replace all underscores with spaces
		str = str.replace(/_/g, " ");

		// Capitalize the first letter of the string
		str = str.charAt(0).toUpperCase() + str.slice(1);

		return str;
	}

	return (
		<article className="parking-item">
			<h3 onClick={() => setIsOpen(!isOpen)}>{parking.nom}</h3>
			{parking.realTime.free > 0 && parking.realTime.free !== "Inconnu" && (
				<p>
					Places disponibles : {parking.realTime.free} ({parking ? Math.round((parking.realTime.free / parking.realTime.total) * 100) : 0}%){" "}
				</p>
			)}
			{parking.realTime.total > 0 && parking.realTime.total !== "Inconnu" && <p> Total places : {parking.realTime.total} </p>}

			{isOpen && (
				<div>
					{parking.nb_pmr > 0 && <p> Total places PMR : {parking.nb_pmr} </p>}
					{parking && (
						<p>
							{"Adresse : " + parking.adresse} - {<a href={"https://www.google.com/maps/search/?api=1&query=" + parking.Ylat + "," + parking.Xlong}>Google Maps</a>}
						</p>
					)}
					{parking.hauteur_ma > 0 && <p> Hauteux max : {parking.hauteur_ma} cm </p>}
					{parking.nbre_niv > 0 && <p> Nombres d'étages : {parking.nbre_niv} </p>}
					{parking.type_ouvra && <p> Type : {replaceUnderscores(parking.type_ouvra)} </p>}
					{parking.typo_fonct && <p> Fonction : {parking.typo_fonct} </p>}

					{parking && (
						<p>
							Propriétaire : {parking.proprietai} {parking.domanialit && "(" + parking.domanialit + ")"}
						</p>
					)}
					{parking.realTime.dateTime && parking.realTime.dateTime !== "Inconnu" && <p> Dernière MAJ : {toHumanReadable(parking.realTime.dateTime)} </p>}
				</div>
			)}
			{<button onClick={() => setIsOpen(!isOpen)}>{isOpen ? "Cacher les détails" : "Afficher les détails"}</button>}
		</article>
	);
}

export default Parking;

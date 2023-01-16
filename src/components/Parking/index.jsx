import { useState, useRef, useEffect } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faLocationDot, faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";

import "./index.scss";

// Function that converts a date string to a human-readable time difference (e.g. "Il y a 2 heures" for a date 2 hours ago)
const dateConverter = (dateString) => {
	// Calculate the difference between the current date and the passed date
	const dateDifference = new Date() - new Date(dateString);
	// Array of objects containing the unit of time (e.g. "jour", "heure", "minute") and the corresponding value in milliseconds
	const units = [
		{ unit: "jour", value: 1000 * 60 * 60 * 24 },
		{ unit: "heure", value: 1000 * 60 * 60 },
		{ unit: "minute", value: 1000 * 60 },
		{ unit: "seconde", value: 1000 },
	];

	// Iterate through the units array to find the largest unit of time that the date difference is greater than or equal to
	for (const { unit, value } of units) {
		if (dateDifference >= value) {
			// Calculate the time amount in the current unit of time
			const timeAmount = Math.round(dateDifference / value);
			// Return the human-readable time difference string
			return `Il y a ${timeAmount} ${unit}${timeAmount > 1 ? "s" : ""}`;
		}
	}
};

function Parking({ parking, toggleFavorite }) {
	const [isOpen, setIsOpen] = useState(false);
	const contentRef = useRef(null);
	const [lastUpdate, setLastUpdate] = useState(dateConverter(parking.realTimeDateTime));

	// UseEffect to update the lastUpdate state every minute
	useEffect(() => {
		const interval = setInterval(() => {
			setLastUpdate(dateConverter(parking.realTimeDateTime));
		}, 1000 * 60);
		// Cleanup function to clear the interval when component unmounts
		return () => clearInterval(interval);
	}, []);

	// function to replace underscores with spaces and capitalize the first letter
	const replaceUnderscores = (string) => {
		return string.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
	};

	// function to get color based on the value
	const getColor = (value) => {
		if (value < 0 || value > 100) {
			throw new Error("Value must be between 0 and 100");
		}
		return value >= 50 ? "#009900" : value >= 15 ? "#FFA500" : "#FF0000";
	};

	// function to render paragraph with key and value
	const renderParagraph = (key, value) => {
		return (
			<div className="parking-item__info">
				<p className="parking-item__info-key">{key}</p>
				<p className="parking-item__info-value">{value}</p>
			</div>
		);
	};

	return (
		<article className="parking-item">
			<div className="parking-item__title-container" style={parking.realTimeFreePercentage !== null ? { backgroundColor: getColor(parking.realTimeFreePercentage) } : {}}>
				<h3 className={"parking-item__title "}>{parking.modName ? parking.modName : parking.nom}</h3>
			</div>

			{parking.realTimeFree !== null && parking.realTimeFree > 0 && parking.realTimeStatus === "Open" && parking.realTimeTotal > 0
				? renderParagraph("Places libres :", `${parking.realTimeFree} / ${parking.realTimeTotal} (${parking.realTimeFreePercentage}%)`)
				: renderParagraph("Total places :", parking.realTimeTotal)}

			{parking.distance !== null && parking.distance > 0 && renderParagraph("Distance :", parking.distance < 1000 ? Math.round(parking.distance) + " m" : (parking.distance / 1000).toFixed(2) + " km")}

			<div className="parking-item__btn">
				<a href={parking.googleMapsLink || `https://www.google.com/maps?q=${parking.Ylat},${parking.Xlong}(Parking ${parking.nom})`} target="_blank" rel="noopener noreferrer">
					<button className="parking-item__btn-location" onClick={() => setIsOpen(!isOpen)}>
						<FontAwesomeIcon icon={faLocationDot} />
					</button>
				</a>
				{parking.isFavorite !== undefined && (
					<button className={`parking-item__btn-favorite ${parking.isFavorite ? " parking-item__btn-favorite--active" : ""}`} onClick={() => setIsOpen(!isOpen)}>
						<FontAwesomeIcon icon={parking.isFavorite ? faStar : faStarRegular} onClick={() => toggleFavorite(parking.id, parking.isFavorite ? false : true)} />
					</button>
				)}
				<button className="parking-item__btn-more" onClick={() => setIsOpen(!isOpen)}>
					<FontAwesomeIcon icon={faChevronDown} className={isOpen ? "chevron-icon chevron-icon--open" : "chevron-icon"} />
				</button>
			</div>

			<div ref={contentRef} className={"parking-item__extra-content"} style={isOpen ? { height: contentRef.current.scrollHeight } : {}}>
				{parking.googleMapsEmbedLink && (
					<div className="parking-item__map-container">
						{isOpen && <iframe title={parking.nom} src={parking.googleMapsEmbedLink} width="100%" height="100%" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>}
					</div>
				)}
				{parking.adresse && renderParagraph("Adresse :", parking.adresse)}
				{parking.nb_pmr > 0 && renderParagraph("Total places PMR :", parking.nb_pmr)}
				{parking.hauteur_ma > 0 && renderParagraph("Hauteur max :", parking.hauteur_ma + " cm")}
				{parking.nbre_niv > 0 && renderParagraph("Nombres d'étages :", parking.nbre_niv)}
				{parking.type_ouvra && renderParagraph("Type :", replaceUnderscores(parking.type_ouvra))}
				{parking.typo_fonct && renderParagraph("Fonction :", replaceUnderscores(parking.typo_fonct))}
				{parking && renderParagraph("Propriétaire :", parking.proprietai + (parking.domanialit ? ` (${parking.domanialit})` : ""))}
				{parking.realTimeDateTime && parking.realTimeDateTime !== null && renderParagraph("Dernière MAJ :", lastUpdate)}
			</div>
		</article>
	);
}

export default Parking;

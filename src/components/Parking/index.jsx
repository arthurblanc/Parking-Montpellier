import { useState, useRef } from "react";
import "./index.scss";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faLocationDot, faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";

function Parking({ parking, toggleFavorite }) {
	const [isOpen, setIsOpen] = useState(false);
	const contentRef = useRef(null);
	const [hoverFavorite, setHoverFavorite] = useState(false);
	const [hoverPin, setHoverPin] = useState(false);

	function toHumanReadable(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now - date;

		const units = [
			{ unit: "jour", value: 1000 * 60 * 60 * 24 },
			{ unit: "heure", value: 1000 * 60 * 60 },
			{ unit: "minute", value: 1000 * 60 },
			{ unit: "seconde", value: 1000 },
		];

		for (const { unit, value } of units) {
			if (diff >= value) {
				const timeAmount = Math.round(diff / value);
				return `il y a ${timeAmount} ${unit}${timeAmount > 1 ? "s" : ""}`;
			}
		}
	}

	function replaceUnderscores(str) {
		return str.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
	}

	function getColor(value) {
		if (value < 0 || value > 100) {
			throw new Error("Value must be between 0 and 100");
		}
		return value >= 50 ? "#009900" : value >= 15 ? "#FFA500" : "#FF0000";
	}

	const getGoogleMapsLink = (parking) => {
		return parking.googleMapsLink ? parking.googleMapsLink : "https://www.google.com/maps?q=" + parking.Ylat + "," + parking.Xlong + "(Parking " + parking.nom + ")";
	};

	const getDistance = (distance) => {
		return distance < 1000 ? Math.round(distance) : (distance / 1000).toFixed(2);
	};

	return (
		<article className={`parking-item`}>
			<div className="title-container" style={parking.realTimeMedium !== null ? { backgroundColor: getColor(parking.realTimeMedium) } : {}}>
				<h3 className="title">{parking.modName ? parking.modName : parking.nom}</h3>
				<div style={{ display: "flex" }}>
					{parking && (
						<a href={getGoogleMapsLink(parking)} target="_blank" rel="noopener noreferrer">
							<FontAwesomeIcon
								icon={faLocationDot}
								style={{ fontSize: "1.6rem", color: "#00008B", marginRight: "1rem" }}
								onMouseEnter={() => setHoverPin(true)}
								onMouseLeave={() => setHoverPin(false)}
								beat={hoverPin}
							/>
						</a>
					)}
					{parking.isFavorite ? (
						<FontAwesomeIcon
							icon={faStar}
							style={{ fontSize: "1.6rem", color: "#FFD700", cursor: "pointer" }}
							onClick={() => toggleFavorite(parking.id, false)}
							onMouseEnter={() => setHoverFavorite(true)}
							onMouseLeave={() => setHoverFavorite(false)}
							beat={hoverFavorite}
						/>
					) : (
						<FontAwesomeIcon
							icon={faStarRegular}
							style={{ fontSize: "1.6rem", cursor: "pointer" }}
							onClick={() => toggleFavorite(parking.id, true)}
							onMouseEnter={() => setHoverFavorite(true)}
							onMouseLeave={() => setHoverFavorite(false)}
							beat={hoverFavorite}
						/>
					)}
				</div>
			</div>

			{parking.realTimeFree > 0 && parking.realTimeFree !== null && parking.realTimeStatus === "Open" && (
				<p>
					<span className="key">Places libres :</span> {parking.realTimeFree} ({parking.realTimeMedium}%)
				</p>
			)}
			{parking.realTimeTotal > 0 && parking.realTimeTotal !== null && (
				<p>
					<span className="key">Total places :</span> {parking.realTimeTotal}
				</p>
			)}

			{parking.distance > 0 && parking.distance !== null && (
				<p>
					<span className="key">Distance : </span> {getDistance(parking.distance)} {parking.distance < 1000 ? "m" : "km"}
				</p>
			)}

			<div className={"extra-content"} style={isOpen ? { height: contentRef.current.scrollHeight } : { height: 0 }}>
				<div ref={contentRef}>
					{parking && (
						<p>
							<span className="key">Adresse : </span> {parking.adresse}
						</p>
					)}
					{parking.nb_pmr > 0 && (
						<p>
							<span className="key">Total places PMR :</span> {parking.nb_pmr}
						</p>
					)}
					{parking.hauteur_ma > 0 && (
						<p>
							<span className="key">Hauteux max :</span> {parking.hauteur_ma} cm
						</p>
					)}
					{parking.nbre_niv > 0 && (
						<p>
							<span className="key">Nombres d'étages :</span> {parking.nbre_niv}
						</p>
					)}
					{parking.type_ouvra && (
						<p>
							<span className="key">Type :</span> {replaceUnderscores(parking.type_ouvra)}
						</p>
					)}
					{parking.typo_fonct && (
						<p>
							<span className="key">Fonction :</span> {parking.typo_fonct}
						</p>
					)}
					{parking && (
						<p>
							<span className="key">Propriétaire :</span> {parking.proprietai} {parking.domanialit && "(" + parking.domanialit + ")"}
						</p>
					)}
					{parking.realTimeDateTime && parking.realTimeDateTime !== null && (
						<p>
							<span className="key">Dernière MAJ :</span> {toHumanReadable(parking.realTimeDateTime)}
						</p>
					)}
				</div>
			</div>

			{
				<button onClick={() => setIsOpen(!isOpen)}>
					<FontAwesomeIcon icon={faChevronDown} className={isOpen ? "chevron-open" : ""} />
				</button>
			}
		</article>
	);
}

export default Parking;

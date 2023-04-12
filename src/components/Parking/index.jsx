import { useState, useRef, useEffect } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faLocationDot, faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";

import "./index.scss";

// Function that converts a date string to a human-readable time difference (e.g. "Il y a 2 heures" for a date 2 hours ago)
const dateConverter = (dateString) => {
	const PARIS_TIMEZONE_OFFSET = 120; // Time difference between Paris and UTC in minutes
	const date = new Date(dateString);
	const utcDate = new Date(date.getTime() - PARIS_TIMEZONE_OFFSET * 60 * 1000); // Convert UTC date to Paris date
	// Calculate the difference between the current date and the passed date
	const dateDifference = new Date() - utcDate;
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

// Component to render ParkingInfo with key and value
const ParkingInfo = ({ title, value, unit }) => {
	// This function capitalizes the first letter of a string.
	const capitalizeFirstLetter = (str) => {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	// If the value is null, undefined, "NC", "_" or less than 1, return null.
	if (!value || value === "null" || value === "undefined" || value === "NC" || value === "_" || value < 1) {
		return null;
	}

	let formattedValue = value;

	// If the value is a string, capitalize its first letter.
	if (typeof value === "string") {
		formattedValue = capitalizeFirstLetter(value);
	}

	// If the value is an array, filter out "feeCharged" items and translate "car" and "moped" to "Voiture" and "Moto" respectively.
	if (Array.isArray(value)) {
		value = value.filter((item) => item !== "feeCharged");
		value = value.map((item) => {
			if (item === "car") {
				return "Voiture";
			} else if (item === "moped") {
				return "Moto";
			} else {
				return item;
			}
		});

		// Capitalize the first letter of each item and join them with ", ".
		formattedValue = value.map((item) => capitalizeFirstLetter(item)).join(", ");
	}

	// Return a div with a title and formatted value with the specified unit.
	return (
		<div className="parking-item__info">
			<p className="parking-item__info-key">{title} :</p>
			<p className="parking-item__info-value">
				{formattedValue} {unit}
			</p>
		</div>
	);
};

function Parking({ parking, toggleFavorite }) {
	const [isOpen, setIsOpen] = useState(false);
	const contentRef = useRef(null);
	const [lastUpdate, setLastUpdate] = useState(parking.realTimeData?.status.metadata.timestamp ? dateConverter(parking.realTimeData?.status.metadata.timestamp.value) : "");

	// UseEffect to update the lastUpdate state every minute
	useEffect(() => {
		const interval = setInterval(() => {
			setLastUpdate(parking.realTimeData?.status.metadata.timestamp ? dateConverter(parking.realTimeData?.status.metadata.timestamp.value) : "");
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

	return (
		<article className="parking-item">
			<div
				className="parking-item__title-container"
				style={
					parking.realTimeData?.availableSpotPercentage.value && parking.realTimeData?.isLastUpdateLessThanOneHour?.value === true
						? { backgroundColor: getColor(parking.realTimeData.availableSpotPercentage.value) }
						: {}
				}>
				<h3 className={"parking-item__title "}>{parking.extraData?.modName ? parking.extraData.modName : parking.name.value}</h3>
			</div>

			{parking.realTimeData && parking.realTimeData.status.value === "Open" && parking.realTimeData.isLastUpdateLessThanOneHour.value === true ? (
				<ParkingInfo title="Places libres" value={`${parking.realTimeData.availableSpotNumber.value} / ${parking.realTimeData.totalSpotNumber.value} (${parking.realTimeData.availableSpotPercentage.value}%)`} />
			) : (
				<ParkingInfo title="Total places" value={parking.parkingSpaceNumber.value} />
			)}

			{parking.distance?.value > 0 && <ParkingInfo title="Distance" value={parking.distance.value < 1000 ? Math.round(parking.distance.value) + " m" : (parking.distance.value / 1000).toFixed(2) + " km"} />}

			<div className="parking-item__btn">
				<a
					href={parking.extraData?.googleMapsLink || `https://www.google.com/maps?q=${parking.latitude.value},${parking.longitude.value}(Parking ${parking.name.value})`}
					target="_blank"
					rel="noopener noreferrer">
					<button className="parking-item__btn-location" onClick={() => setIsOpen(!isOpen)}>
						<FontAwesomeIcon icon={faLocationDot} />
					</button>
				</a>
				{parking.isFavorite !== undefined && (
					<button className={`parking-item__btn-favorite ${parking.isFavorite ? " parking-item__btn-favorite--active" : ""}`} onClick={() => toggleFavorite(parking.id, parking.isFavorite ? false : true)}>
						<FontAwesomeIcon icon={parking.isFavorite ? faStar : faStarRegular} />
					</button>
				)}
				<button className="parking-item__btn-more" onClick={() => setIsOpen(!isOpen)}>
					<FontAwesomeIcon icon={faChevronDown} className={isOpen ? "chevron-icon chevron-icon--open" : "chevron-icon"} />
				</button>
			</div>

			<div ref={contentRef} className={"parking-item__extra-content"} style={isOpen ? { height: contentRef.current.scrollHeight } : {}}>
				{parking.extraData?.googleMapsEmbedLink && (
					<div className="parking-item__map-container">
						{isOpen && (
							<iframe title={parking.name.value} src={parking.extraData.googleMapsEmbedLink} width="100%" height="100%" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
						)}
					</div>
				)}
				<ParkingInfo title="Adresse" value={parking.address.value} />
				<ParkingInfo title="Total places PMR" value={parking.disabledParkingNumber.value} />
				<ParkingInfo title="Hauteur max" value={parking.maxHeight.value} unit="cm" />
				<ParkingInfo title="Véhicules autorisés" value={parking.realTimeData?.allowedVehicleType?.value} />
				<ParkingInfo title="Nombres d'étages" value={parking.levelNumber.value} />
				<ParkingInfo title="Surface" value={parking.usableSurfaceArea.value} unit="m2" />
				<ParkingInfo title="Payant" value={parking.isFree.value === "false" ? "Oui" : "Non"} />
				<ParkingInfo title="Type" value={replaceUnderscores(parking.parkingType.value)} />
				<ParkingInfo title="Fonction" value={parking.typology.value} />
				<ParkingInfo title="Usage" value={parking.typeOfUse.value} />
				<ParkingInfo title="Propriétaire" value={parking.owner.value + (parking.domaniality && parking.domaniality.value !== "_" ? ` (${parking.domaniality.value})` : "")} />
				<ParkingInfo title="Numéro Siret" value={parking.siretNumber.value} />
				{parking.realTimeData?.status.metadata.timestamp && parking.realTimeData?.isLastUpdateLessThanOneHour.value === true && <ParkingInfo title="Dernière MAJ" value={lastUpdate} />}
			</div>
		</article>
	);
}

export default Parking;

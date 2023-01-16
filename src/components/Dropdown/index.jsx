import React, { useState } from "react";

import "./index.scss";

function Dropdown({ label, options, selected, onSelectedChange }) {
	//useState hook to toggle the dropdown
	const [open, setOpen] = useState(false);
	//function to handle onClick event on the options
	const handleOnClick = (option) => {
		//call the onSelectedChange function passed as props with the selected option
		onSelectedChange(option);
		//close the dropdown
		setOpen(false);
	};
	//render the dropdown
	return (
		<div className="dropdown">
			<label className="dropdown__label">{label}</label>
			<span className="dropdown__button-container">
				<button className="dropdown__button" onClick={() => setOpen(!open)}>
					{selected.label}
				</button>
				{open && (
					<div className="dropdown__options-container">
						{options.map((option) => (
							<div
								key={option.value + option.direction}
								className={`dropdown__option ${option.value === selected.value && option.direction === selected.direction ? "selected" : ""}`}
								onClick={() => handleOnClick(option)}
							>
								{option.label}
							</div>
						))}
					</div>
				)}
			</span>
		</div>
	);
}

export default Dropdown;

import React, { useState } from "react";
import "./index.scss";

function Dropdown({ label, options, selected, onSelectedChange }) {
	const [open, setOpen] = useState(false);

	function handleOnClick(option) {
		onSelectedChange(option);
		setOpen(false);
	}

	return (
		<div className="dropdown-container">
			<label className="dropdown-label-text">{label}</label>
			<span className="dropdown-button-container">
				<button className="dropdown-button" onClick={() => setOpen(!open)}>
					{selected.label}
				</button>
				{open && (
					<div className="dropdown-options-container">
						{options.map((option) => (
							<div key={option.value} className={`dropdown-option ${option.value === selected.value ? "dropdown-option-selected" : ""}`} onClick={() => handleOnClick(option)}>
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

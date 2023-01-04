import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";

/**
 * Router to render the Header, the Sidebar and the 4 pages of the application
 *
 * @category Router
 * @component
 * @returns { React.Component } A React component
 */
function Router() {
	return (
		<React.StrictMode>
			<BrowserRouter basename="Parking-Montpellier">
				<Routes>
					<Route exact path="/" element={<App />} />
				</Routes>
			</BrowserRouter>
		</React.StrictMode>
	);
}

export default Router;

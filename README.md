# Parking Montpellier

![forthebadge](https://forthebadge.com/images/badges/uses-js.svg)
[![forthebadge](https://forthebadge.com/images/badges/uses-git.svg)](https://github.com/ArthurBlanc)
[![React](https://img.shields.io/badge/react-20232a?style=for-the-badge&logo=react&logocolor=61dafb)](https://reactjs.org/)

[Live app](https://arthurblanc.github.io/Parking-Montpellier/) - <a href="#a-propos-du-projet">README en Français</a> - <a href="#about-the-project">English README</a>

---

## A propos du projet

Ce projet est une application web qui affiche des informations sur les parkings de la ville de Montpellier, France. Les données proviennent du [portail de données ouvertes de la ville](https://data.montpellier3m.fr/), et l'application permet aux utilisateurs de consulter les informations des parkings, l'occupation des parkings en temps réel.

## Fonctionnalités

-   Visualisez en temps réel la disponibilité des places de parking à Montpellier
-   Filtrez les places de parking par nom, disponibilité et distance par rapport à votre emplacement
-   Ajoutez des places de parking à vos favoris pour un accès rapide
-   Afficher les détails de chaque place de parking, y compris l'adresse, la capacité et la disponibilité en temps réel
-   Visualisez les parkings sur une carte interactive

## Instructions

Ces instructions vous permettront d'obtenir une copie du projet opérationnel sur votre ordinateur local à des fins de développement et de test.

### Prérequis

-   npm / yarn
-   Un serveur cors-proxy et éventuellement une clé API pour celui-ci

### Installation

Pour installer le projet, exécutez les commandes suivantes :

1. Clonez le dépôt :

```sh
git clone https://github.com/ArthurBlanc/Parking-Montpellier.git
```

2. Installez les dépendances :

```sh
yarn
```

ou

```sh
npm install
```

3. Créez un fichier .env et ajoutez :

```sh
REACT_APP_CORS_PROXY_URL="YOUR-CORS-PROXY-URL"
```

et éventuellement

```sh
REACT_APP_CORS_PROXY_API_KEY="YOUR-CORS-PROXY-API-KEY"
```

4. Démarrez le serveur de développement :

```sh
yarn start
```

ou

```sh
npm start
```

5. Ouvrez [http://localhost:3000](http://localhost:3000) pour afficher l'application dans le navigateur

## Développé avec

-   [Code Visual Studio](https://code.visualstudio.com/) - Un éditeur de code source léger mais puissant
-   [React 18](https://fr.reactjs.org/) - Bibliothèque JavaScript pour la construction d'interfaces utilisateur
-   [Create React App](https://create-react-app.dev/) - Un moyen officiellement pris en charge pour créer des applications React
-   [React Router V6](https://reactrouter.com/) - Routage déclaratif pour les applications Web React
-   [Sass](https://sass-lang.com/) - Puissant langage d'extension CSS de qualité professionnelle
-   [CORS Anywhere](https://www.npmjs.com/package/cors-anywhere) - Un proxy NodeJS qui ajoute des en-têtes CORS à la requête proxy
-   [Font Awesome](https://fontawesome.com/) - Bibliothèque d'icônes et boîte à outils
-   [GitHub](https://github.com/) - Une plate-forme d'hébergement de code pour le contrôle de version et la collaboration
-   [Portail Open Data de la Ville de Montpellier](https://data.montpellier3m.fr/)

## Auteur

Arthur BLANC - [GitHub](https://github.com/ArthurBlanc)

---

## About The Project

This project is a web application that displays information about parking in the city of Montpellier, France. The data is sourced from the [city's open data portal](https://data.montpellier3m.fr/), and the application allows users to view parking information, view real-time parking occupancy data, and save their favorite parking locations.

## Features

-   View real-time availability of parking spaces in Montpellier
-   Filter parking spaces by name, availability, and distance from your location
-   Add parking spaces to your favorites for quick access
-   View details about each parking space, including address, capacity, and real-time availability
-   View parking spaces on an interactive map

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   npm / yarn
-   A cors-proxy server and eventually the a API key for it

### Installation

To install the project, run the following commands:

1. Clone the repository:

```sh
git clone https://github.com/ArthurBlanc/Parking-Montpellier.git
```

2. Install dependencies:

```sh
yarn
```

or

```sh
npm install
```

3. Create a .env file and add:

```sh
REACT_APP_CORS_PROXY_URL="YOUR-CORS-PROXY-URL"
```

and eventually

```sh
REACT_APP_CORS_PROXY_API_KEY="YOUR-CORS-PROXY-API-KEY"
```

4. Start the development server:

```sh
yarn start
```

or

```sh
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view the app in the browser

## Built With

-   [Visual Studio Code](https://code.visualstudio.com/) - A lightweight but powerful source code editor
-   [React 18](https://fr.reactjs.org/) - JavaScript library for building user interfaces
-   [Create React App](https://create-react-app.dev/) - An officially supported way to create React applications
-   [React Router V6](https://reactrouter.com/) - Declarative routing for React web applications
-   [Sass](https://sass-lang.com/) - Powerful professional grade CSS extension language
-   [CORS Anywhere](https://www.npmjs.com/package/cors-anywhere) - A NodeJS proxy which adds CORS headers to the proxied request
-   [Font Awesome](https://fontawesome.com/) - Internet's icon library and toolkit
-   [GitHub](https://github.com/) - A code hosting platform for version control and collaboration
-   [City of Montpellier Open Data Portal](https://data.montpellier3m.fr/)

## Author

Arthur BLANC - [GitHub](https://github.com/ArthurBlanc)

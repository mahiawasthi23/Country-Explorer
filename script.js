const countryList = document.getElementById('country-list');
const searchInput = document.getElementById('search');
const suggestions = document.getElementById('suggestions');
const loadMoreButton = document.getElementById('load-more');
const favoritesList = document.getElementById('favorite-list');
const languageFilter = document.getElementById('language-filter');
const regionFilter = document.getElementById('region-filter');
const countryDetails = document.getElementById('country-details');

let currentPage = 1;
const pageSize = 10;
let countries = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let filteredCountries = [];

async function fetchCountries() {
    const response = await fetch(`https://restcountries.com/v3.1/all`);
    countries = await response.json();
    populateLanguageFilter();
    filteredCountries = countries;
    displayCountries(currentPage);
}

function populateLanguageFilter() {
    const languages = new Set();
    countries.forEach(country => {
        if (country.languages) {
            Object.values(country.languages).forEach(lang => languages.add(lang));
        }
    });
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.innerText = lang;
        languageFilter.appendChild(option);
    });
}

function displayCountries(page, countriesToDisplay = filteredCountries) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCountries = countriesToDisplay.slice(startIndex, endIndex);

    paginatedCountries.forEach(country => {
        const card = document.createElement('div');
        card.className = 'country-card';
        const isFavorite = favorites.includes(country.name.common);
        card.innerHTML = `
            <img src="${country.flags.png}" alt="${country.name.common} flag" />
            <h3>${country.name.common}</h3>
            <button class="favorite-icon" onclick="toggleFavorite('${country.name.common}', this.querySelector('i'))">
                <i class="fas fa-heart" style="color: ${isFavorite ? 'red' : 'grey'};" data-country="${country.name.common}"></i>
            </button>
        `;
        card.onclick = () => showDetails(country);
        countryList.appendChild(card);
    });

    loadMoreButton.style.display = endIndex >= countriesToDisplay.length ? 'none' : 'block';
}

function showDetails(country) {
    countryDetails.innerHTML = `
        <div>
            <h2>${country.name.common}</h2>
            <p><strong>Top Level Domain:</strong> ${country.tld ? country.tld[0] : 'N/A'}</p>
            <p><strong>Capital:</strong> ${country.capital}</p>
            <p><strong>Region:</strong> ${country.region}</p>
            <p><strong>Population:</strong> ${country.population}</p>
            <p><strong>Area:</strong> ${country.area} km²</p>
            <p><strong>Languages:</strong> ${Object.values(country.languages || {}).join(', ')}</p>
            <button onclick="goBack()">Back</button>
        </div>
    `;
    countryDetails.style.display = 'block';
}

function goBack() {
    countryDetails.style.display = 'none';
}

function applyFiltersAndDisplay() {
    const query = searchInput.value.toLowerCase();
    const selectedLanguage = languageFilter.value;
    const selectedRegion = regionFilter.value;

    filteredCountries = countries;

    if (query) {
        filteredCountries = filteredCountries.filter(country =>
            country.name.common.toLowerCase().startsWith(query)
        );
    }
    if (selectedLanguage) {
        filteredCountries = filteredCountries.filter(country =>
            country.languages && Object.values(country.languages).includes(selectedLanguage)
        );
        regionFilter.value = "";
    } else if (selectedRegion) {
        filteredCountries = filteredCountries.filter(country => country.region === selectedRegion);
        languageFilter.value = "";
    }


    currentPage = 1;
    countryList.innerHTML = '';
    displayCountries(currentPage, filteredCountries);
}


searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    if (!query) {
        suggestions.innerHTML = '';
        return;
    }
    const filteredCountries = countries.filter(country =>
        country.name.common.toLowerCase().startsWith(query)
    ).slice(0, 5);

    suggestions.innerHTML = filteredCountries.map(country => `
        <div class="suggestion-item" onclick="showAllMatchingCountries('${query}')">
            ${country.name.common}
        </div>
    `).join('');

    if (filteredCountries.length > 0) {
        suggestions.innerHTML += `<div class="suggestion-item view-all" onclick="showAllMatchingCountries('${query}')">
            View all results for "${query}"
        </div>`;
    }
});

function showAllMatchingCountries(query) {
    const filteredCountries = countries.filter(country =>
        country.name.common.toLowerCase().startsWith(query)
    );
    countryList.innerHTML = '';
    displayCountries(1, filteredCountries);
    currentPage = 1;
    suggestions.innerHTML = '';
}

function toggleFavorite(countryName, iconElement = null) {

    if (favorites.includes(countryName)) {
        favorites = favorites.filter(fav => fav !== countryName);
        if (iconElement) iconElement.style.color = 'grey';
    } else {
        favorites.push(countryName);
        if (iconElement) iconElement.style.color = 'red';
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesList();
    updateCardFavoriteIcon(countryName);
}

function updateCardFavoriteIcon(countryName) {
    const icons = document.querySelectorAll(`.country-card .fas.fa-heart[data-country="${countryName}"]`);
    icons.forEach(icon => {
        icon.style.color = favorites.includes(countryName) ? 'red' : 'grey';
    });
}

function updateFavoritesList() {
    favoritesList.innerHTML = '';
    favorites.forEach(countryName => {
        const country = countries.find(c => c.name.common === countryName);
        if (country) {
            const card = document.createElement('div');
            card.className = 'country-card';
            card.innerHTML = `
                <img src="${country.flags.png}" alt="${country.name.common} flag" />
                <h3>${country.name.common}</h3>
                <button class="favorite-icon" onclick="toggleFavorite('${country.name.common}', this.querySelector('i'))">
                    <i class="fas fa-heart" style="color: red;" data-country="${country.name.common}"></i>
                </button>
            `;

            card.onclick = () => showDetails(country);


            const removeButton = document.createElement('button');
            removeButton.innerText = 'Remove';
            removeButton.onclick = (event) => {
                event.stopPropagation();
                toggleFavorite(countryName);
                updateFavoritesList();
            };

            card.appendChild(removeButton);
            favoritesList.appendChild(card);
        }
    });
}

loadMoreButton.addEventListener('click', () => {
    currentPage++;
    displayCountries(currentPage, filteredCountries);
});

searchInput.addEventListener('input', applyFiltersAndDisplay);
languageFilter.addEventListener('change', applyFiltersAndDisplay);
regionFilter.addEventListener('change', applyFiltersAndDisplay);
fetchCountries();

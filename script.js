const API_KEY = '85867277a76b9be60e1c3d975484bea3';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM-element
const resultsContainer = document.getElementById('resultsContainer');
const resultsTitle = document.getElementById('resultsTitle');
const topRatedBtn = document.getElementById('topRatedBtn');
const popularBtn = document.getElementById('popularBtn');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const controlButtons = document.querySelectorAll('.control-button');

// --- Ny hjälprutin för att hämta detaljer (Steg 1) ---
async function fetchDetails(itemId, itemType) {
    // TMDb-slutpunkten för detaljer är /movie/{id} eller /person/{id}
    const endpoint = `/${itemType}/${itemId}`; 
    
    // Återanvänder den befintliga fetchTMDb-funktionen
    const data = await fetchTMDb(endpoint); 
    return data;
}

// --- Ny funktion för att skapa detaljvyn (Steg 2) ---
function createDetailedView(details, itemType) {
    const detailDiv = document.createElement('div');
    detailDiv.className = 'detailed-view';
    
    let infoHTML = '';
    let title = details.title || details.name;

    let imageUrl = details.poster_path || details.profile_path;
    imageUrl = imageUrl ? `${IMAGE_BASE_URL}${imageUrl}` : 'http://via.placeholder.com/500x750?text=Ingen+bild';

    if (itemType === 'movie') {
        const releaseDate = details.release_date ? details.release_date.split('-').reverse().join('-') : 'Okänt datum';
        const runtime = details.runtime ? `${details.runtime} minuter` : 'N/A';
        const genres = details.genres ? details.genres.map(g => g.name).join(', ') : 'Okänt';

        infoHTML = `
            <h2>${title}</h2>
            <p><strong>Släppdatum:</strong> ${releaseDate}</p>
            <p><strong>Längd:</strong> ${runtime}</p>
            <p><strong>Genre:</strong> ${genres}</p>
            <p><strong>Betyg:</strong> ${details.vote_average ? details.vote_average.toFixed(1) : 'N/A'}</p>
            <p><strong>Beskrivning:</strong> ${details.overview || 'Ingen beskrivning tillgänglig.'}</p>
        `;

    } else if (itemType === 'person') {
        const birthday = details.birthday ? details.birthday.split('-').reverse().join('-') : 'N/A';
        const placeOfBirth = details.place_of_birth || 'Okänt';

        infoHTML = `
            <h2>${title}</h2>
            <p><strong>Känd för:</strong> ${details.known_for_department || 'Okänt'}</p>
            <p><strong>Född:</strong> ${birthday}</p>
            <p><strong>Födelseort:</strong> ${placeOfBirth}</p>
            <p><strong>Biografi:</strong> ${details.biography ? details.biography.substring(0, 500) + '...' : 'Ingen biografi tillgänglig.'}</p>
        `;
    }

    // Slutgiltig layout för detaljvyn
    detailDiv.innerHTML = `
        <div class="detail-content">
            <img src="${imageUrl}" alt="${title}" class="detail-image" onerror="this.onerror=null;this.src='http://via.placeholder.com/500x750?text=Ingen+bild';">
            <div class="detail-info">
                ${infoHTML}
            </div>
        </div>
    `;

    return detailDiv;
}
// -----------------------------------------------------------------------

async function handleCardClick(itemId, itemType) {
    console.log(`Klickade på ID: ${itemId}, Typ: ${itemType}`);

    setResultsHeader(`Detaljer för ${itemType === 'movie' ? 'film' : 'person'} (ID: ${itemId})`);
    
    resultsContainer.innerHTML = '<p style="text-align: center;">Hämtar detaljer...</p>';
    
    const details = await fetchDetails(itemId, itemType);

    if (details) {
        const detailsHTML = createDetailedView(details, itemType);

        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(detailsHTML);

    } else {
        resultsContainer.innerHTML = '<p style="text-align: center; color: red;">Kunde inte ladda detaljer. Försök igen.</p>';
    }
 
}

function setResultsHeader(title) {
    resultsTitle.textContent = title;
}

async function fetchTMDb(endpoint) {
    const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=sv-SE`;
   
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fel vid API-anrop:", error);
        setResultsHeader('Ett fel uppstod vid hämtning av data. Vänligen försök igen senare.');
        resultsContainer.innerHTML = '<p style="text-align: center; color: red;">Kunde inte hämta data. Kontrollera din anslutning eller att API-nyckeln är korrekt.</p>';
        return null;
    }
}

function createResultCard(item) {
    const card = document.createElement('div');
    card.className = 'result-card clickable'; 
    card.dataset.id = item.id;
    card.dataset.type = item.media_type === 'person' ? 'person' : 'movie';

    const isMovie = item.media_type === 'movie' || (item.release_date && !item.known_for_department);
    const isPerson = item.media_type === 'person' || item.known_for_department;

    let imageUrl = item.poster_path || item.profile_path;
    imageUrl = imageUrl ? `${IMAGE_BASE_URL}${imageUrl}` : 'http://via.placeholder.com/500x750?text=Ingen+bild';

    let contentHTML = '';
    let title = item.title || item.name;

    if (isMovie) {
        const releaseDate = item.release_date ? item.release_date.split('-').reverse().join('-') : 'Okänt datum';
        const description = item.overview || 'Ingen beskrivning tillgänglig.';

        if (resultsTitle.textContent.includes('Topp 10')) {
             contentHTML = `
                <h3 class="result-card-title">${title}</h3>
                <p><strong>Släppdatum:</strong> ${releaseDate}</p>
            `;
        } else {
             contentHTML = `
                <h3 class="result-card-title">${title}</h3>
                <p><strong>Släppdatum:</strong> ${releaseDate}</p>
                <p class="result-card-description">${description.substring(0, 150)}...</p>
            `;
        }
    } else if (isPerson) {
        const knownFor = item.known_for_department || 'Okänt';
        
        const knownForList = item.known_for && item.known_for.length > 0 ? 
            item.known_for.slice(0, 5).map(work => {
                const type = work.media_type === 'movie' ? 'Film' : (work.media_type === 'tv' ? 'TV-serie' : 'Annat');
                const workTitle = work.title || work.name;
                return `<li><strong>${type}:</strong> ${workTitle}</li>`;
            }).join('')
            : '<li>Inga kända verk listade.</li>';

        contentHTML = `
            <h3 class="result-card-title">${title}</h3>
            <p><strong>Känd för:</strong> ${knownFor}</p>
            <p><strong>Mest känd för:</strong></p>
            <ul class="known-for-list" style="list-style-type: none; padding-left: 0; margin-top: 0;">
                ${knownForList}
            </ul>
        `;
    } else {
        return null; 
    }

    card.innerHTML = `
        <div class="result-card-image-wrapper">
            <img src="${imageUrl}" alt="${title}" class="result-card-image" onerror="this.onerror=null;this.src='http://via.placeholder.com/500x750?text=Ingen+bild';">
        </div>
        <div class="result-card-content">
            ${contentHTML}
        </div>
    `;

    return card;
}

function displayResults(results) {
    resultsContainer.innerHTML = '';
    
    const validCards = results.map(item => createResultCard(item)).filter(card => card !== null);

    if (validCards.length > 0) {
        validCards.forEach(card => {
            resultsContainer.appendChild(card);
        });
        
        // Här läggs Event Delegation till för att hantera klick på korten
        // Obs: Vi vill undvika att lägga till denna listener flera gånger.
        // I en robust app skulle detta skötas en gång vid sidladdning.
        // Om du lägger in detta i `displayResults` kan du behöva ta bort den gamla lyssnaren först, 
        // eller flytta logiken till utanför displayResults för att köra den bara en gång.

    } else {
        resultsContainer.innerHTML = '<p style="text-align: center;">Hittade inga resultat. Vänligen försök med en annan sökterm.</p>';
    }
}

// **VIKTIGT FIX:** Event delegation för klickhantering bör endast läggas till EN GÅNG 
// när sidan laddas, inte varje gång `displayResults` anropas.
resultsContainer.addEventListener('click', (e) => {
    const clickedCard = e.target.closest('.result-card.clickable');
    
    if (clickedCard) {
        const id = clickedCard.dataset.id;
        const type = clickedCard.dataset.type;
        handleCardClick(id, type);
    }
});


async function showTopRated() {
    setResultsHeader('Topp 10 Högst Rankade Filmer Just Nu');
    clearActiveClass();
    topRatedBtn.classList.add('active-list');

    const data = await fetchTMDb('/movie/top_rated');
    if (data && data.results) {
        displayResults(data.results.slice(0, 10));
    }
}

async function showPopular() {
    setResultsHeader('Topp 10 Mest Populära Filmer Just Nu');
    clearActiveClass();
    popularBtn.classList.add('active-list');

    const data = await fetchTMDb('/movie/popular');
    if (data && data.results) {
        displayResults(data.results.slice(0, 10));
    }
}

async function searchAll(query) {
    setResultsHeader(`Sökresultat för: "${query}"`);
    clearActiveClass();

    const encodedQuery = encodeURIComponent(query.trim());
    const endpoint = `/search/multi?query=${encodedQuery}`;
    const data = await fetchTMDb(endpoint);

    if (data && data.results) {
        const filteredResults = data.results.filter(item => 
            item.media_type === 'movie' || item.media_type === 'person'
        );
        displayResults(filteredResults);
    }
}

function clearActiveClass() {
    controlButtons.forEach(btn => {
        btn.classList.remove('active-list');
    });
}


topRatedBtn.addEventListener('click', showTopRated);

popularBtn.addEventListener('click', showPopular);

searchForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const query = searchInput.value.trim();
    if (query) {
        searchAll(query);
    } else {
        alert('Vänligen ange ett sökord.');
    }
});

document.addEventListener('DOMContentLoaded', showPopular); // Laddar populära filmer vid start
import './css/styles.css';
import { Notify } from 'notiflix';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

let searchQueryResult = '';
let searchInput = '';
let pageNumber = 1;
let gallery = new SimpleLightbox('.gallery a');

const pixabayAPI = {
  baseUrl: 'https://pixabay.com/api/',
  key: '34964599-890d3804982641bc7b112e0d5',
  image_type: 'photo',
  orientation: 'horizontal',
  safesearch: 'true',
  order: 'popular',
  page: '1',
  per_page: '40',
};

const markupData = {
  markup: '',
  htmlCode: '',
};

const searchForm = document.querySelector('.search-form');
const gallerySelector = document.querySelector('.gallery');

searchForm.addEventListener('submit', async e => {
  e.preventDefault();
  const {
    elements: { searchQuery },
  } = e.target;

  searchQueryResult = searchQuery.value;

  if (searchQueryResult === '') {
    gallerySelector.innerHTML = '';
    btnLoadMore.classList.remove('is-visible');
    return Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  }

  if (searchQueryResult !== searchInput) {
    pageNumber = 1;
    pixabayAPI.page = `${pageNumber}`;
    gallerySelector.innerHTML = '';
    btnLoadMore.classList.remove('is-visible');
  } else {
    pageNumber += 1;
    pixabayAPI.page = `${pageNumber}`;
    btnLoadMore.classList.remove('is-visible');
  }

  searchInput = searchQueryResult;

  try {
    const results = await fetchPhotos(searchQueryResult);
    markupData.htmlCode = await renderedPhotos(results);
    gallerySelector.insertAdjacentHTML('beforeend', markupData.htmlCode);
    btnLoadMore.classList.add('is-visible');

    gallery.refresh();

    const { page, per_page } = pixabayAPI;
    const { totalHits } = results;
    const totalPages = Math.ceil(totalHits / per_page);

    if (page >= totalPages) {
      btnLoadMore.classList.remove('is-visible');
    }

    Notify.success(`'Hooray! We found ${results.totalHits} images.'`);

    console.log('results', results);
  } catch (error) {
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  }
});

const btnLoadMore = document.querySelector('.load-more');
btnLoadMore.addEventListener('click', async () => {
  pageNumber += 1;
  pixabayAPI.page = `${pageNumber}`;

  try {
    const results = await fetchPhotos(searchQueryResult);
    markupData.htmlCode = await renderedPhotos(results);
    gallerySelector.insertAdjacentHTML('beforeend', markupData.htmlCode);
    btnLoadMore.classList.add('is-visible');
    gallery.refresh();

    const { page, per_page } = pixabayAPI;
    const { totalHits } = results;
    const totalPages = Math.ceil(totalHits / per_page);

    if (page >= totalPages) {
      btnLoadMore.classList.remove('is-visible');
    }
  } catch (error) {
    Notify.failure(
      "We're sorry, but you've reached the end of search results."
    );
  }
});

async function fetchPhotos(searchQueryResult) {
  const {
    baseUrl,
    key,
    image_type,
    orientation,
    safesearch,
    order,
    page,
    per_page,
  } = pixabayAPI;

  pixabayAPI.page = `${pageNumber}`;

  const response = await axios.get(
    `${baseUrl}?key=${key}&q=${searchInput}&image_type=${image_type}&orientation=${orientation}&safesearch=${safesearch}&order=${order}&page=${page}&per_page=${per_page}`
  );
  const results = response.data;

  const { total, totalHits } = results;
  const totalPages = Math.ceil(totalHits / per_page);

  if (total === 0) {
    throw new Error();
  }

  if (page >= totalPages) {
    btnLoadMore.classList.remove('is-visible');
    Notify.failure(
      "We're sorry, but you've reached the end of search results."
    );
    return results;
  }

  return results;
}

async function renderedPhotos(results) {
  const { hits } = results;

  markupData.markup = hits
    .map(
      hit =>
        `<a href="${hit.largeImageURL}"><div class="photo-card">
        <img src="${hit.webformatURL}" alt="${hit.tags}" loading="lazy"
          class="img-item" />
        <div class="info">
    <p class="info-item">
      <b>Likes:</b>${hit.likes}
    </p>
    <p class="info-item">
      <b>Views:</b>${hit.views}
    </p>
    <p class="info-item">
      <b>Comments:</b>${hit.comments}
    </p>
    <p class="info-item">
      <b>Downloads:</b>${hit.downloads}
    </p>
  </div>
</div></a>`
    )
    .join('');

  return markupData.markup;
}

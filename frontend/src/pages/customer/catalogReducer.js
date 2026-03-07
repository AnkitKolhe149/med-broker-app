/**
 * Catalog State Reducer
 * Manages filter and UI state for the medicine catalog
 */

// Initial state
export const initialCatalogState = {
	// Filter state
	searchQuery: '',
	categoryFilter: 'all',
	availabilityFilter: 'all',
	prescriptionFilter: 'all',
	sortBy: 'relevance',
	minPrice: 0,
	maxPrice: 500,
	
	// UI state
	currentPage: 1,
	filterWidth: 350,
	isResizing: false,
	showMobileFilters: false,
	
	// Data state
	medicines: [],
	loading: true,
	searching: false
};

// Action types
export const CATALOG_ACTIONS = {
	// Filter actions
	SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
	SET_CATEGORY_FILTER: 'SET_CATEGORY_FILTER',
	SET_AVAILABILITY_FILTER: 'SET_AVAILABILITY_FILTER',
	SET_PRESCRIPTION_FILTER: 'SET_PRESCRIPTION_FILTER',
	SET_SORT_BY: 'SET_SORT_BY',
	SET_MIN_PRICE: 'SET_MIN_PRICE',
	SET_MAX_PRICE: 'SET_MAX_PRICE',
	RESET_PRICE_RANGE: 'RESET_PRICE_RANGE',
	RESET_FILTERS: 'RESET_FILTERS',
	
	// UI actions
	SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
	SET_FILTER_WIDTH: 'SET_FILTER_WIDTH',
	SET_IS_RESIZING: 'SET_IS_RESIZING',
	TOGGLE_MOBILE_FILTERS: 'TOGGLE_MOBILE_FILTERS',
	SET_SHOW_MOBILE_FILTERS: 'SET_SHOW_MOBILE_FILTERS',
	
	// Data actions
	SET_MEDICINES: 'SET_MEDICINES',
	SET_LOADING: 'SET_LOADING',
	SET_SEARCHING: 'SET_SEARCHING'
};

// Reducer function
export function catalogReducer(state, action) {
	switch (action.type) {
		// Filter actions
		case CATALOG_ACTIONS.SET_SEARCH_QUERY:
			return { ...state, searchQuery: action.payload, currentPage: 1 };
			
		case CATALOG_ACTIONS.SET_CATEGORY_FILTER:
			return { ...state, categoryFilter: action.payload, currentPage: 1 };
			
		case CATALOG_ACTIONS.SET_AVAILABILITY_FILTER:
			return { ...state, availabilityFilter: action.payload, currentPage: 1 };
			
		case CATALOG_ACTIONS.SET_PRESCRIPTION_FILTER:
			return { ...state, prescriptionFilter: action.payload, currentPage: 1 };
			
		case CATALOG_ACTIONS.SET_SORT_BY:
			return { ...state, sortBy: action.payload };
			
		case CATALOG_ACTIONS.SET_MIN_PRICE:
			return { ...state, minPrice: action.payload, currentPage: 1 };
			
		case CATALOG_ACTIONS.SET_MAX_PRICE:
			return { ...state, maxPrice: action.payload, currentPage: 1 };
			
		case CATALOG_ACTIONS.RESET_PRICE_RANGE:
			return { ...state, minPrice: 0, maxPrice: 500, currentPage: 1 };
			
		case CATALOG_ACTIONS.RESET_FILTERS:
			return {
				...state,
				searchQuery: '',
				categoryFilter: 'all',
				availabilityFilter: 'all',
				prescriptionFilter: 'all',
				sortBy: 'relevance',
				minPrice: 0,
				maxPrice: 500,
				currentPage: 1
			};
			
		// UI actions
		case CATALOG_ACTIONS.SET_CURRENT_PAGE:
			return { ...state, currentPage: action.payload };
			
		case CATALOG_ACTIONS.SET_FILTER_WIDTH:
			return { ...state, filterWidth: action.payload };
			
		case CATALOG_ACTIONS.SET_IS_RESIZING:
			return { ...state, isResizing: action.payload };
			
		case CATALOG_ACTIONS.TOGGLE_MOBILE_FILTERS:
			return { ...state, showMobileFilters: !state.showMobileFilters };
			
		case CATALOG_ACTIONS.SET_SHOW_MOBILE_FILTERS:
			return { ...state, showMobileFilters: action.payload };
			
		// Data actions
		case CATALOG_ACTIONS.SET_MEDICINES:
			return { ...state, medicines: action.payload, loading: false };
			
		case CATALOG_ACTIONS.SET_LOADING:
			return { ...state, loading: action.payload };
			
		case CATALOG_ACTIONS.SET_SEARCHING:
			return { ...state, searching: action.payload };
			
		default:
			return state;
	}
}

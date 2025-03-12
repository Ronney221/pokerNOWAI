/**
 * Handles page navigation with smooth scrolling
 * @param {string} page - The page to navigate to
 * @param {function} setCurrentPage - The function to update the current page
 */
export const handlePageChange = (page, setCurrentPage) => {
  // Validate setCurrentPage is a function
  if (typeof setCurrentPage !== 'function') {
    console.error('setCurrentPage must be a function');
    return;
  }

  // Update the page
  setCurrentPage(page);
  
  // Smooth scroll to top
  window.scrollTo({ 
    top: 0, 
    behavior: 'smooth' 
  });
}; 
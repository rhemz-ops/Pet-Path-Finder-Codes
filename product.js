// const buyNowBtn = document.getElementById('buyNowBtn');
// const buyModal = document.getElementById('buyModal');
// const closeModal = document.getElementById('closeModal');
// const thankYouCard = document.getElementById('thankYouCard');
// const closeThankYouBtn = document.getElementById('closeThankYouBtn');
// const imageUpload = document.getElementById('imageUpload');
// const imagePreview = document.getElementById('imagePreview');
// const imagePreviewContainer = document.getElementById('imagePreviewContainer');

// // Open modal
// buyNowBtn.addEventListener('click', () => {
//   buyModal.style.display = 'flex';
// });

// // Close modal
// closeModal.addEventListener('click', () => {
//   buyModal.style.display = 'none';
// });

// // Show Thank You Card after form submission
// const purchaseForm = document.getElementById('purchaseForm');
// purchaseForm.addEventListener('submit', (e) => {
//   e.preventDefault();
//   buyModal.style.display = 'none';
//   thankYouCard.style.display = 'flex';
// });

// // Close Thank You Card
// closeThankYouBtn.addEventListener('click', () => {
//   thankYouCard.style.display = 'none';
// });

// // File upload preview
// imageUpload.addEventListener('change', (e) => {
//   const file = e.target.files[0];
//   if (file) {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       imagePreview.src = event.target.result;
//       imagePreviewContainer.style.display = 'block';
//     };
//     reader.readAsDataURL(file);
//   }
// });

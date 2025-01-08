// Get all the images in the gallery
const galleryImages = document.querySelectorAll('.gallery-image');

// Loop through each image and add a click event listener
galleryImages.forEach(image => {
    image.addEventListener('click', () => {
        // Create a new div element for the zoomed image container
        const zoomedImage = document.createElement('div');
        zoomedImage.classList.add('zoomed-image-container');

        // Create a close button
        const closeButton = document.createElement('span');
        closeButton.textContent = 'X';
        closeButton.classList.add('close-btn');
        zoomedImage.appendChild(closeButton);

        // Create the zoomed image element
        const img = document.createElement('img');
        img.src = image.src;  // Set the image src to the clicked image src
        img.classList.add('zoomed-image');
        zoomedImage.appendChild(img);

        // Add the zoomed image container to the body
        document.body.appendChild(zoomedImage);

        // Close the zoomed image on clicking the close button
        closeButton.addEventListener('click', () => {
            zoomedImage.remove();
        });

        // Close the zoomed image on clicking outside the image
        zoomedImage.addEventListener('click', (e) => {
            if (e.target === zoomedImage) {
                zoomedImage.remove();
            }
        });
    });
});


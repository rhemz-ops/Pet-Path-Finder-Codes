import { firestore, storage, collection, doc, setDoc, ref, uploadBytes, getDownloadURL } from './firebaseConfig.js';

// Assign the close function to the global scope
window.closeThankYouModal = function () {
    const modal = document.getElementById("thankYouModal");
    modal.style.display = "none"; // Hide the modal
};

document.getElementById("purchaseFormDetails").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    const loadingSpinner = document.getElementById("loadingSpinner");
    const thankYouModal = document.getElementById("thankYouModal");
    const form = event.target;

    // Show loading spinner
    loadingSpinner.style.display = "flex";

    // Retrieve form values
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("emailAddress").value;
    const phone = document.getElementById("phoneNumber").value;
    const street = document.getElementById("streetAddress").value;
    const barangay = document.getElementById("barangay").value;
    const city = document.getElementById("city").value;
    const province = document.getElementById("province").value;
    const postalCode = document.getElementById("postalCode").value;
    const imageFile = document.getElementById("imageUpload").files[0]; // Get the uploaded file

    try {
        // Validate that an image file was selected
        if (!imageFile) {
            throw new Error("Please upload an image before submitting the form.");
        }

        // Upload image to Firebase Storage
        const storageRef = ref(storage, `purchaseProofs/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        const imageUrl = await getDownloadURL(storageRef);

        // Prepare form data
        const formValues = {
            fullName,
            email,
            phone,
            address: {
                street,
                barangay,
                city,
                province,
                postalCode,
            },
            proofImageUrl: imageUrl,
            timestamp: new Date().toISOString(),
        };

        // Save form data to Firestore
        const userCollection = collection(firestore, "purchaseRequests");
        const newDocRef = doc(userCollection); // Automatically generates a unique document ID
        await setDoc(newDocRef, formValues);

        // Show thank you modal
        thankYouModal.style.display = "flex";
    } catch (error) {
        alert(error.message || "An error occurred. Please try again.");
    } finally {
        // Hide loading spinner
        loadingSpinner.style.display = "none";

        // Reset the form
        form.reset();
    }
});

const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'dm99z4ybh', 
  api_key: '797813764543377', 
  api_secret: 'Kb7THARSPtAfXdj4JWLCTf1UrPU' 
});

async function run() {
    try {
        console.log("Uploading demo image...");
        const result = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/sample.jpg", {
            public_id: "travhub_demo_sample"
        });
        
        console.log("Upload Success!");
        console.log("Public ID:", result.public_id);
        console.log("Secure URL:", result.secure_url);
        
        console.log("\nImage Details:");
        console.log("- Width:", result.width);
        console.log("- Height:", result.height);
        console.log("- Format:", result.format);
        console.log("- Size (bytes):", result.bytes);
        
        console.log("\nGenerating transformed image URL...");
        // fetch_format: 'auto' (f_auto) = automatically selects the best image format for the browser (like WebP or AVIF)
        // quality: 'auto' (q_auto) = automatically compresses the image without visible quality loss
        const transformedUrl = cloudinary.url(result.public_id, {
            fetch_format: 'auto',
            quality: 'auto'
        });
        
        console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
        console.log(transformedUrl);
        
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
    }
}

run();

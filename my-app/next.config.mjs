/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            "files.edgestore.dev"
        ]
    },
    logging: {
        fetches: {
            fullUrl: true,
        }
    }
};

export default nextConfig;

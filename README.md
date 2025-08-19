# Browser Usage Tracker

Browser Usage Tracker is a cross-browser extension designed to help you understand and analyze your browsing habits while maintaining full control over your privacy. It provides detailed analytics, secure cloud synchronization, and robust privacy features, including end-to-end encryption.

## Features

- **Detailed Analytics**: Track the time you spend on different websites and view detailed reports.
- **Privacy Controls**: Manage your privacy with options to export or delete your data at any time.
- **Secure Authentication**: Supports both email/password and Google OAuth for secure login.
- **Cloud Sync**: Sync your browsing data across different devices using a self-hostable Appwrite backend.
- **End-to-End Encryption**: All your browsing data is encrypted before being sent to the backend, ensuring that only you can access it.
- **Cross-Browser Support**: Built with WXT to support both Chrome and Firefox.

## Tech Stack

- **[WXT](https://wxt.dev/)**: A next-generation framework for building cross-browser extensions.
- **[React](https://react.dev/)**: A popular JavaScript library for building user interfaces.
- **[Appwrite](https://appwrite.io/)**: An open-source backend-as-a-service platform for web and mobile developers.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
- **[Chart.js](https://www.chartjs.org/)**: A flexible JavaScript charting library for data visualization.
- **[TypeScript](https://www.typescriptlang.org/)**: A typed superset of JavaScript that compiles to plain JavaScript.
- **[Jest](https://jestjs.io/)**: A delightful JavaScript Testing Framework with a focus on simplicity.

## Getting Started

Follow these instructions to get the extension up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- An [Appwrite](https://appwrite.io/) instance (you can use the cloud version or self-host)
- A [Google Cloud](https://console.cloud.google.com/) account for OAuth setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/browser-usage-tracker.git
cd browser-usage-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Appwrite

This project includes a script to automate the setup of your Appwrite backend.

1.  **Create a `.env` file** by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  **Fill in your Appwrite credentials** in the `.env` file. You will need your Appwrite endpoint, project ID, and an API key.

    ```env
    # Appwrite configuration
    VITE_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
    VITE_APPWRITE_PROJECT_ID="your-project-id"
    APPWRITE_API_KEY="your-api-key"

    # The following will be populated by the setup script
    VITE_APPWRITE_DATABASE_ID=""
    VITE_APPWRITE_COLLECTION_ID=""
    ```

3.  **Run the setup script**:
    ```bash
    npm run setup:appwrite
    ```
    This script will create the necessary database and collection in your Appwrite project and update your `.env` file with the new IDs.

### 4. Configure Google OAuth

Follow the steps in [OAUTH_SETUP.md](OAUTH_SETUP.md) to configure Google OAuth for the extension. This is a crucial step for enabling the "Continue with Google" feature.

### 5. Load the Extension in Your Browser

-   **For Chrome**:
    1.  Run `npm run dev` to start the development server.
    2.  Open Chrome and navigate to `chrome://extensions`.
    3.  Enable "Developer mode".
    4.  Click "Load unpacked" and select the `dist` folder in the project directory.

-   **For Firefox**:
    1.  Run `npm run dev:firefox` to start the development server.
    2.  Open Firefox and navigate to `about:debugging`.
    3.  Click "This Firefox" and then "Load Temporary Add-on...".
    4.  Select the `manifest.json` file inside the `dist` folder.

## Usage

The `package.json` file contains several scripts for development and building:

-   `npm run dev`: Starts the development server for Chrome.
-   `npm run dev:firefox`: Starts the development server for Firefox.
-   `npm run build`: Builds the extension for production for Chrome.
-   `npm run build:firefox`: Builds the extension for production for Firefox.
-   `npm run zip`: Zips the production build for Chrome.
-   `npm run zip:firefox`: Zips the production build for Firefox.
-   `npm run test`: Runs the test suite.

## Project Structure

The project is organized as follows:

-   `components/`: Contains shared React components used throughout the extension.
-   `entrypoints/`: Defines the entry points for the extension, such as the popup, content scripts, and background service worker.
-   `lib/`: Contains the core logic of the extension, including Appwrite integration, authentication, data management, and encryption.
-   `scripts/`: Includes helper scripts for tasks like setting up the Appwrite backend.
-   `public/`: Stores static assets like icons.
-   `wxt.config.ts`: The configuration file for WXT, where the extension's manifest and build settings are defined.

## Privacy and Security

This project takes privacy and security seriously. Here are some of the measures we've implemented:

-   **End-to-End Encryption**: Your browsing data is encrypted on your device before it's sent to the Appwrite backend. This means that no one, not even the server administrator, can read your data.
-   **User Control**: You have full control over your data. The extension provides features to export your data in a readable format and to delete all of your data from the backend at any time.
-   **Secure Authentication**: We use Appwrite's secure authentication methods, including Google OAuth, to protect your account.
-   **No Third-Party Tracking**: The extension does not contain any third-party trackers or ads.

## Contributing

Contributions are welcome! If you'd like to contribute to the project, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

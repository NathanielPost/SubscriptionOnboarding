# Subscription Onboarding Form

A modern, responsive subscription form built with React, TypeScript, and Material-UI that allows users to create subscription records and export them to Excel format.

## Features

- **Comprehensive Form Validation**: All fields are validated with appropriate rules for email, phone, postal codes, etc.
- **Multi-Section Layout**: Organized into Account, Billing, Subscription, Member, and dynamic sections
- **Dynamic Tables**: Add/remove rows for Access Codes, Assigned Units, and Vehicle Registration
- **Address Support**: Handles both US and Canadian address formats
- **Excel Export**: Generates Excel files with all form data in legacy format
- **Test Data Autofill**: One-click button to populate form with sample data
- **Responsive Design**: Mobile-friendly layout that works on all screen sizes
- **Modern UI**: Beautiful Material-UI components with custom theming

## Technologies Used

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - React component library
- **Vite** - Fast build tool and development server
- **XLSX** - Excel file generation
- **CSS Grid** - Modern responsive layouts

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd subscription-uploading
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Fill out the form**: Enter all required information across the different sections
2. **Add dynamic data**: Use the Add buttons to include multiple access codes, assigned units, and vehicles
3. **Test data**: Click "Fill Test Data" to populate the form with sample information
4. **Submit**: Click Submit to validate and export your data to Excel

## Form Sections

- **Account Information**: Basic account holder details
- **Billing Information**: Billing contact and address (can copy from account info)
- **Subscription Details**: Subscription type, dates, and configuration
- **Member Information**: Primary member details and rate plan
- **Access Codes**: Dynamic table for security codes and permits
- **Assigned Units**: Dynamic table for parking spaces or units
- **Vehicle Registration**: Dynamic table for vehicle information

## Excel Export

The form generates Excel files with the following naming convention:
`subscription_[LastName]_[Date].xlsx`

Files are automatically downloaded to your browser's default download folder.

## Project Structure

```
src/
├── components/
│   └── SubscriptionForm.tsx    # Main form component
├── types/
│   └── subscription.ts         # TypeScript interfaces
├── main.tsx                    # Application entry point
└── index.css                   # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

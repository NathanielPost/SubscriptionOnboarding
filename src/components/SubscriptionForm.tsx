import React, { useState, useEffect } from 'react';
import { SubscriptionData, AccessCode, AssignedUnit, Vehicle } from '../types/subscription';
import * as XLSX from 'xlsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert, SelectChangeEvent,
  Autocomplete, Tooltip, Checkbox, FormControlLabel
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';


// Theme creation
const companyTheme = createTheme({
  palette: {
    primary: { main: '#007dba', contrastText: '#fff' }, // Company blue
    secondary: { main: '#B20838', contrastText: '#fff' }, // Company red
    warning: { main: '#ffb300', contrastText: '#000' },   // Accent yellow
    background: { default: '#f5f7fa', paper: '#fff' },
    text: { primary: '#222', secondary: '#007dba' },
  },
  typography: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    h4: { color: '#007dba', fontWeight: 700 },
    h6: { color: '#b00135', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

const ACCOUNT_TEMPLATE_HEADERS = [
  'name',
  'firstname',
  'lastname',
  'email',
  'phone',
  'address 1',
  'address 2',
  'city',
  'state',
  'country',
  'zipcode',
  'Use account address as billing address? (Y/N)'
];

const SubscriptionForm: React.FC = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    const getAccountId = (): number => {
        const key = 'accountIdCounter';
        const currentId = parseInt(localStorage.getItem(key) || '1', 10);
        localStorage.setItem(key, (currentId).toString());
        return currentId;
    };
    const changeAccountId = () => {
        const key = 'accountIdCounter';
        const currentId = parseInt(localStorage.getItem(key) || '1', 10);
        localStorage.setItem(key, (currentId + 1).toString());
        return currentId + 1;
    }
    const resetAccountIdCounter = () => {
        const resetConfirm = window.confirm("Are you sure you want to reset the Account ID counter? ");
        if (!resetConfirm) {
            alert("Account ID counter reset cancelled.");
            return;
        } else {
            const key = 'accountIdCounter';
            localStorage.setItem(key, '1');
            // Reset the form and assign a new Account ID
            setFormData({
                RunId: 10,
                AccountId: getAccountId(),
                accessCodes: [],
                assignedUnits: [],
                vehicles: []
            });
            setErrors({});
            setCopyAccountToBilling(false);
            setImportError(null);
            setImportSuccess(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const [formData, setFormData] = useState<Partial<SubscriptionData>>({
        RunId: 10,
        AccountId: getAccountId(), // Use a function to get the next account ID
        accessCodes: [],
        assignedUnits: [],
        vehicles: []
    } as Partial<SubscriptionData>);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [copyAccountToBilling, setCopyAccountToBilling] = useState(false);

    // --- TOP OF FORM: Data Template Download & Import UI ---
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    // Helper functions for dynamic arrays
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const addAccessCode = () => {
        if ((formData.accessCodes || []).length >= 3) return;
        const newAccessCode: AccessCode = {
            code: '',
            type: ''
        };
        setFormData(prev => ({
            ...prev,
            accessCodes: [...(prev.accessCodes || []), newAccessCode]
        }));
    };

    const removeAccessCode = (id: string) => {
        setFormData(prev => ({
            ...prev,
            accessCodes: (prev.accessCodes || []).filter(item => item.id !== id)
        }));
        // Clear any errors for this row
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.includes(`accessCode_${id}`)) {
                delete newErrors[key];
            }
        });
        setErrors(newErrors);
    };

    const updateAccessCode = (id: string, field: keyof AccessCode, value: string) => {
        setFormData(prev => ({
            ...prev,
            accessCodes: (prev.accessCodes || []).map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const addAssignedUnit = () => {
        if ((formData.assignedUnits || []).length >= 1) return;
        const newUnit: AssignedUnit = {
            unit: '',
        };
        setFormData(prev => ({
            ...prev,
            assignedUnits: [...(prev.assignedUnits || []), newUnit]
        }));
    };

    const removeAssignedUnit = (id: string) => {
        setFormData(prev => ({
            ...prev,
            assignedUnits: (prev.assignedUnits || []).filter(item => item.id !== id)
        }));
        // Clear any errors for this row
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.includes(`assignedUnit_${id}`)) {
                delete newErrors[key];
            }
        });
        setErrors(newErrors);
    };

    const updateAssignedUnit = (id: string, field: keyof AssignedUnit, value: string) => {
        setFormData(prev => ({
            ...prev,
            assignedUnits: (prev.assignedUnits || []).map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const addVehicle = () => {
        if ((formData.vehicles || []).length >= 3) return;
        const newVehicle: Vehicle = {
            id: generateId(),
            name: '',
            plateNumber: '',
            make: '',
            model: '',
            color: '',
            state: ''
        };
        setFormData(prev => ({
            ...prev,
            vehicles: [...(prev.vehicles || []), newVehicle]
        }));
    };

    const removeVehicle = (id: string) => {
        setFormData(prev => ({
            ...prev,
            vehicles: (prev.vehicles || []).filter(item => item.id !== id)
        }));
        // Clear any errors for this row
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.includes(`vehicle_${id}`)) {
                delete newErrors[key];
            }
        });
        setErrors(newErrors);
    };

    const updateVehicle = (id: string, field: keyof Vehicle, value: string) => {
        setFormData(prev => ({
            ...prev,
            vehicles: (prev.vehicles || []).map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const validateField = (field: keyof SubscriptionData, value: any): string => {
        switch (field) {
            case 'RunId':
                if (!value || value <= -1) return 'Run ID is required and must be a positive number';
                if (value > 10000) return 'Run ID must be 10000 or less';
                break;

            case 'AccountId':
                if (!value || value <= 0) return 'Account ID is required and must be a positive number';
                if (value < 0 || value > 999999) return 'Account ID must be between 0 and 999999';
                break;

            case 'AccountFirstName':
            case 'AccountLastName':
            case 'SubscriptionMemberFirstName':
            case 'SubscriptionMemberLastName':
            case 'AccountBillToFirstName':
            case 'AccountBillToLastName':
                if (!value || value.trim() === '') return `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
                if (value.length < 2) return `${field.replace(/([A-Z])/g, ' $1').trim()} must be at least 2 characters`;
                if (value.length > 50) return `${field.replace(/([A-Z])/g, ' $1').trim()} must be 50 characters or less`;
                break;

            case 'AccountEmail':
            case 'AccountBillToEmail':
            case 'SubscriptionMemberEmail':
                if (!value || value.trim() === '') {
                    if (field === 'AccountEmail' || field === 'AccountBillToEmail') {
                        return `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
                    }
                    return ''; // Optional for member email
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) return 'Must be a valid email format';
                break;

            case 'AccountPhone':
            case 'AccountBillToPhone':
            case 'SubscriptionMemberPhone':
                if (value && value.trim() !== '') {
                    const phoneRegex = /^\(\d{3}\)\d{3}-\d{4}$/;
                    if (!phoneRegex.test(value)) return 'Must be in valid phone format: (XXX)XXX-XXXX';
                }
                break;

            case 'AccountAddress1':
            case 'AccountBillToAddress1':
                if (value && value.length > 100) return 'Address must be 100 characters or less';
                break;

            case 'AccountCity':
            case 'AccountBillToCity':
                if (value && value.length > 50) return 'City must be 50 characters or less';
                break;

            case 'AccountState':
            case 'AccountBillToState':
                if (!value || value.trim() === '') return 'State is required';
                break;

            case 'AccountPostalCode':
                if (!value || value.trim() === '') return 'Postal Code is required';
                const usZipRegex = /^\d{5}(-\d{4})?$/; // US ZIP: 12345 or 12345-6789
                const canPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/; // Canadian: A1A 1A1 or A1A-1A1
                if (!usZipRegex.test(value) && !canPostalRegex.test(value)) {
                    return 'Must be valid postal code format (US: 12345 or 12345-6789, CA: A1A 1A1 or A1A-1A1)';
                }
                break;

            case 'AccountBillToPostalCode':
                if (value && value.trim() !== '') {
                    const usZipRegex = /^\d{5}(-\d{4})?$/; // US ZIP: 12345 or 12345-6789
                    const canPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/; // Canadian: A1A 1A1 or A1A-1A1
                    if (!usZipRegex.test(value) && !canPostalRegex.test(value)) {
                        return 'Must be valid postal code format (US: 12345 or 12345-6789, CA: A1A 1A1 or A1A-1A1)';
                    }
                }
                break;

            case 'AccountCountry':
            case 'AccountBillToCountry':
                if (!value || value.trim() === '') return 'Country is required';
                const validCountries = ['CA', 'US'];
                if (!validCountries.includes(value.toUpperCase())) return 'Must be CA or US';
                break;

            case 'AccountType':
                if (!value || value.trim() === '') return 'Account Type is required';
                const validTypes = ['Corporate', 'Individual'];
                if (!validTypes.includes(value)) return 'Must be Corporate or Individual';
                break;

            case 'SubscriptionName':
                if (!value || value.trim() === '') return 'Subscription Name is required';
                if (value.length > 100) return 'Subscription Name must be 100 characters or less';
                break;

            case 'SubscriptionType':
                if (!value || value.trim() === '') return 'Subscription Type is required';
                const validSubTypes = ['TERMED', 'EVERGREEN'];
                if (!validSubTypes.includes(value.toUpperCase())) return 'Must be TERMED or EVERGREEN';
                break;

            case 'SubscriptionEffectiveDate':
                if (!value) return 'Effective Date is required';
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDate = new Date(value);
                selectedDate.setHours(0, 0, 0, 0);
                if (selectedDate < today) return 'Effective Date cannot be in the past';
                break;

            case 'SubscriptionInvoiceTemplate':
                if (!value || value.trim() === '') return 'Invoice Template is required';
                const validTemplates = ['LAZ_STANDARD', 'LAZ_STANDARD_MAIL', 'LAZ_SUMMARY', 'LAZ_SUMMARY_MAIL', 'IPC_STANDARD', 'IPC_STANDARD_FR', 'IPC_SUMMARY', 'IPC_SUMMARY_FR'];
                if (!validTemplates.includes(value.toUpperCase())) return 'Must reference valid template';
                break;

            case 'SubscriptionMemberId':
                if (!value || value <= 0) return 'Member ID is required and must be a positive number';
                break;

            case 'SubscriptionMemberRateplanName':
                if (!value || value.trim() === '') return 'Member Rate Plan Name is required';
                if (value.length > 100) return 'Rate Plan Name must be 100 characters or less';
                break;

            case 'SubscriptionMemberVehicle1PlateNumber':
            case 'SubscriptionMemberVehicle2PlateNumber':
            case 'SubscriptionMemberVehicle3PlateNumber':
                if (value && value.trim() !== '') {
                    if (value.length < 2 || value.length > 10) return 'Plate number must be 2-10 characters';
                }
                break;

            // Parking-related validations
            case 'SubscriptionMemberVehicle1Name':
            case 'SubscriptionMemberVehicle2Name':
            case 'SubscriptionMemberVehicle3Name':
                if (value && value.trim() !== '') {
                    if (value.length > 50) return 'Vehicle name must be 50 characters or less';
                }
                break;

            case 'SubscriptionMemberVehicle1Make':
            case 'SubscriptionMemberVehicle2Make':
            case 'SubscriptionMemberVehicle3Make':
                if (value && value.trim() !== '') {
                    if (value.length < 2 || value.length > 30) return 'Vehicle make must be 2-30 characters';
                }
                break;

            case 'SubscriptionMemberVehicle1Model':
            case 'SubscriptionMemberVehicle2Model':
            case 'SubscriptionMemberVehicle3Model':
                if (value && value.trim() !== '') {
                    if (value.length < 2 || value.length > 30) return 'Vehicle model must be 2-30 characters';
                }
                break;

            case 'SubscriptionMemberVehicle1Color':
            case 'SubscriptionMemberVehicle2Color':
            case 'SubscriptionMemberVehicle3Color':
                if (value && value.trim() !== '') {
                    if (value.length < 2 || value.length > 20) return 'Vehicle color must be 2-20 characters';
                    // Common colors validation
                    const validColors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Silver', 'Gray', 'Grey', 'Brown', 'Orange', 'Purple', 'Pink', 'Gold', 'Beige', 'Tan', 'Maroon', 'Navy'];
                    if (!validColors.some(color => color.toLowerCase() === value.toLowerCase())) {
                        return 'Please enter a standard vehicle color';
                    }
                }
                break;

            // Access Code validations
            case 'SubscriptionAccessCode1':
            case 'SubscriptionAccessCode2':
            case 'SubscriptionAccessCode3':
                if (value && value.trim() !== '') {
                    // Must be 4-12 characters, alphanumeric
                    if (value.length < 4 || value.length > 12) return 'Access code must be 4-12 characters';
                    if (!/^[A-Za-z0-9]+$/.test(value)) return 'Access code must be alphanumeric only';
                }
                break;

            case 'SubscriptionAccessCodeType1':
            case 'SubscriptionAccessCodeType2':
            case 'SubscriptionAccessCodeType3':
                if (value && value.trim() !== '') {
                    const validCodeTypes = ['PERMIT', 'PROXCARD'];
                    if (!validCodeTypes.includes(value.toUpperCase())) {
                        return 'Must be PERMIT or PROXCARD';
                    }
                }
                break;

            // Assigned Unit validations
            case 'SubscriptionMemberAssignedUnit1':
            case 'SubscriptionMemberAssignedUnit2':
            case 'SubscriptionMemberAssignedUnit3':
                if (value && value.trim() !== '') {
                    // Unit number validation - alphanumeric, 1-10 characters
                    if (value.length < 1 || value.length > 10) return 'Unit number must be 1-10 characters';
                    if (!/^[A-Za-z0-9]+$/.test(value)) return 'Unit number must be alphanumeric only';
                }
                break;

            // Tax Number validations
            case 'SubscriptionTaxNumber1':
            case 'SubscriptionTaxNumber2':
                if (value && value.trim() !== '') {
                    // Tax ID format validation - can be EIN or SSN format
                    const einRegex = /^\d{2}-\d{7}$/; // EIN format: XX-XXXXXXX
                    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/; // SSN format: XXX-XX-XXXX
                    const simpleNumberRegex = /^\d{9,11}$/; // Simple 9-11 digit number
                    
                    if (!einRegex.test(value) && !ssnRegex.test(value) && !simpleNumberRegex.test(value)) {
                        return 'Tax number must be in valid format (XX-XXXXXXX, XXX-XX-XXXX, or 9-11 digits)';
                    }
                }
                break;

            // Language validation
            case 'SubscriptionDefaultLanguage':
                if (value && value.trim() !== '') {
                    const validLanguages = ['EN_US', 'FR_CA', 'EN_CA'];
                    if (!validLanguages.includes(value.toUpperCase())) {
                        return 'Must be EN_US, FR_CA, or EN_CA';
                    }
                }
                break;

            // Additional address validations
            case 'AccountAddress2':
            case 'AccountBillToAddress2':
                if (value && value.length > 100) return 'Address Line 2 must be 100 characters or less';
                break;

            // Enhanced name validations
            case 'AccountBillToName':
                if (!value || value.trim() === '') return 'Bill To Name is required';
                if (value.length < 2) return 'Bill To Name must be at least 2 characters';
                if (value.length > 100) return 'Bill To Name must be 100 characters or less';
                break;

            // State/Province validations for vehicles
            case 'SubscriptionMemberVehicle1State':
            case 'SubscriptionMemberVehicle2State':
            case 'SubscriptionMemberVehicle3State':
                if (value && value.trim() !== '') {
                    const validStates = [
                        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
                    ];
                    const validProvinces = [
                        'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
                    ];
                    const validStatesProvinces = [...validStates, ...validProvinces];
                    if (!validStatesProvinces.includes(value.toUpperCase())) {
                        return 'Must be a valid US state or Canadian province abbreviation';
                    }
                }
                break;

            default:
                return '';
        }
        return '';
    };

    const handleInputChange = (field: keyof SubscriptionData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Validate the field
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        // Required fields validation
        const requiredFields: (keyof SubscriptionData)[] = [
            'RunId', 'AccountId', 'AccountFirstName', 'AccountLastName', 'AccountEmail',
            'AccountState', 'AccountPostalCode', 'AccountCountry', 'AccountType',
            'AccountBillToName', 'AccountBillToFirstName', 'AccountBillToLastName', 
            'AccountBillToEmail', 'AccountBillToState', 'AccountBillToCountry',
            'SubscriptionId', 'SubscriptionName', 'SubscriptionType', 
            'SubscriptionEffectiveDate', 'SubscriptionInvoiceTemplate',
            'SubscriptionMemberId', 'SubscriptionMemberFirstName', 
            'SubscriptionMemberLastName', 'SubscriptionMemberRateplanName'
        ];

        requiredFields.forEach(field => {
            const value = formData[field];
            const error = validateField(field, value);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        // Validate all other fields that have values
        Object.keys(formData).forEach(key => {
            const field = key as keyof SubscriptionData;
            const value = formData[field];
            if (value !== undefined && value !== null && value !== '') {
                const error = validateField(field, value);
                if (error) {
                    newErrors[field] = error;
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    // Helper function to convert dynamic arrays back to legacy format for Excel export
    const convertToLegacyFormat = (data: Partial<SubscriptionData>): any => {
        // Use a plain object for legacyData to allow dynamic string keys
        const legacyData: { [key: string]: any } = { ...data };
        legacyData['AccountName'] = `${data.AccountFirstName || ''} ${data.AccountLastName || ''}`.trim();

        // Convert access codes array to legacy fields
        if (data.accessCodes && data.accessCodes.length > 0) {
            data.accessCodes.forEach((accessCode, index) => {
                if (index < 3) { // Only handle first 3 access codes for legacy compatibility
                    legacyData[`SubscriptionAccessCode${index + 1}`] = accessCode.code;
                    legacyData[`SubscriptionAccessCodeType${index + 1}`] = accessCode.type;
                }
            });
        }

        // Convert assigned units array to legacy fields
        if (data.assignedUnits && data.assignedUnits.length > 0) {
            data.assignedUnits.forEach((unit, index) => {
                if (index < 3) { // Only handle first 3 units for legacy compatibility
                    legacyData[`SubscriptionMemberAssignedUnit${index + 1}`] = unit.unit;
                }
            });
        }

        // Convert vehicles array to legacy fields
        if (data.vehicles && data.vehicles.length > 0) {
            data.vehicles.forEach((vehicle, index) => {
                if (index < 3) { // Only handle first 3 vehicles for legacy compatibility
                    legacyData[`SubscriptionMemberVehicle${index + 1}Name`] = vehicle.name;
                    legacyData[`SubscriptionMemberVehicle${index + 1}PlateNumber`] = vehicle.plateNumber;
                    legacyData[`SubscriptionMemberVehicle${index + 1}Make`] = vehicle.make;
                    legacyData[`SubscriptionMemberVehicle${index + 1}Model`] = vehicle.model;
                    legacyData[`SubscriptionMemberVehicle${index + 1}Color`] = vehicle.color;
                    legacyData[`SubscriptionMemberVehicle${index + 1}State`] = vehicle.state;
                }
            });
        }

        // Convert Date object to string for Excel
        if (legacyData.SubscriptionEffectiveDate instanceof Date) {
            legacyData.SubscriptionEffectiveDate = legacyData.SubscriptionEffectiveDate.toISOString().split('T')[0];
        }

        // Remove the dynamic arrays from the export data
        delete legacyData.accessCodes;
        delete legacyData.assignedUnits;
        delete legacyData.vehicles;

        return legacyData;
    };

    // Helper function to generate Excel file
    const generateExcelFile = (data: Partial<SubscriptionData>) => {
        try {
            // Convert to legacy format
            const legacyData = convertToLegacyFormat(data);

            // Create a new workbook
            const workbook = XLSX.utils.book_new();

            // Define the column order based on all possible legacy fields
            const columnOrder = [
                'RunId',
                'AccountId',
                'AccountName',
                'AccountFirstName',
                'AccountLastName',
                'AccountEmail',
                'AccountPhone',
                'AccountAddress1',
                'AccountAddress2',
                'AccountCity',
                'AccountState',
                'AccountPostalCode',
                'AccountCountry',
                'AccountType',
                'AccountBillToName',
                'AccountBillToFirstName',
                'AccountBillToLastName',
                'AccountBillToEmail',
                'AccountBillToPhone',
                'AccountBillToAddress1',
                'AccountBillToAddress2',
                'AccountBillToCity',
                'AccountBillToState',
                'AccountBillToPostalCode',
                'AccountBillToCountry',
                'SubscriptionId',
                'SubscriptionName',
                'SubscriptionType',
                'SubscriptionEffectiveDate',
                'SubscriptionInvoiceTemplate',
                'SubscriptionDefaultLanguage',
                'SubscriptionTaxNumber1',
                'SubscriptionTaxNumber2',
                'SubscriptionMemberId',
                'SubscriptionMemberFirstName',
                'SubscriptionMemberLastName',
                'SubscriptionMemberEmail',
                'SubscriptionMemberPhone',
                'SubscriptionMemberRateplanName',
                'SubscriptionAccessMemberCode1',
                'SubscriptionAccessMemberCodeType1',
                'SubscriptionAccessMemberCode2',
                'SubscriptionAccessMemberCodeType2',
                'SubscriptionAccessMemberCode3',
                'SubscriptionAccessMemberCodeType3',
                'SubscriptionMemberAssignedUnit1',
                'SubscriptionMemberAssignedUnit2',
                'SubscriptionMemberAssignedUnit3',
                'SubscriptionMemberVehicle1Name',
                'SubscriptionMemberVehicle1PlateNumber',
                'SubscriptionMemberVehicle1State',
                'SubscriptionMemberVehicle1Color',
                'SubscriptionMemberVehicle1Make',
                'SubscriptionMemberVehicle1Model',
                'SubscriptionMemberVehicle2Name',
                'SubscriptionMemberVehicle2PlateNumber',
                'SubscriptionMemberVehicle2State',
                'SubscriptionMemberVehicle2Color',
                'SubscriptionMemberVehicle2Make',
                'SubscriptionMemberVehicle2Model',
                'SubscriptionMemberVehicle3Name',
                'SubscriptionMemberVehicle3PlateNumber',
                'SubscriptionMemberVehicle3State',
                'SubscriptionMemberVehicle3Color',
                'SubscriptionMemberVehicle3Make',
                'SubscriptionMemberVehicle3Model',
            ];

            // Create ordered data array with all columns
            const orderedData: any = {};
            columnOrder.forEach(field => {
                orderedData[field] = legacyData[field] || '';
            });

            // Convert to worksheet
            const worksheet = XLSX.utils.json_to_sheet([orderedData]);

            // Add the worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscription Data');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const filename = `subscription_${legacyData.AccountLastName || 'export'}_${timestamp}.xlsx`;

            // Save the file
            XLSX.writeFile(workbook, filename);

            return filename;
        } catch (error) {
            console.error('Error generating Excel file:', error);
            throw new Error('Failed to generate Excel file');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        formData.RunId = 10;
        console.log('Form submitted:', formData);
        console.log("current position", window.scrollY);
        if (validateForm()) {
            try {
                // Generate and download the Excel file
                const filename = await generateExcelFile(formData);
                
                console.log('Form submitted successfully:', formData);
                console.log('Excel file generated:', filename);
                
                // Show success message
                alert(`Form submitted successfully! The Excel file "${filename}" has been downloaded to your Downloads folder.`);
                changeAccountId();
                window.location.reload();
                
            } catch (error) {
                console.error('Error during form submission:', error);
                alert('Form submitted successfully, but there was an error generating the Excel file. Please try again.');
            }
        } else {
            console.log('Form has validation errors');
            alert('Please fix all validation errors before submitting.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const states = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
    const provinces = [
        'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
    ];

    const countries = ['CA', 'US'];
    const accountTypes = ['Corporate', 'Individual'];
    const subscriptionTypes = ['TERMED', 'EVERGREEN'];
    const invoiceTemplates = ['LAZ_STANDARD', 'LAZ_SUMMARY'];
    const accessCodeTypes = ['PERMIT', 'PROXCARD'];
    const vehicleColors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Silver', 'Gray', 'Grey', 'Brown', 'Orange', 'Purple', 'Pink', 'Gold', 'Beige', 'Tan', 'Maroon', 'Navy'];

    const formatPhoneNumber = (value: string): string => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        
        // Format as (XXX)XXX-XXXX
        if (digits.length >= 10) {
            return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        }
        return value;
    };

    const handlePhoneChange = (field: keyof SubscriptionData, value: string) => {
        const formattedValue = formatPhoneNumber(value);
        handleInputChange(field, formattedValue);
    };

    const handleCopyAccountToBilling = (checked: boolean) => {
        setCopyAccountToBilling(checked);
        
        if (checked) {
            // Copy account information to billing fields
            const updatedFormData = {
                ...formData,
                AccountBillToName: `${formData.AccountFirstName || ''} ${formData.AccountLastName || ''}`.trim(),
                AccountBillToFirstName: formData.AccountFirstName || '',
                AccountBillToLastName: formData.AccountLastName || '',
                AccountBillToEmail: formData.AccountEmail || '',
                AccountBillToPhone: formData.AccountPhone || '',
                AccountBillToAddress1: formData.AccountAddress1 || '',
                AccountBillToAddress2: formData.AccountAddress2 || '',
                AccountBillToCity: formData.AccountCity || '',
                AccountBillToState: formData.AccountState || '',
                AccountBillToPostalCode: formData.AccountPostalCode || '',
                AccountBillToCountry: formData.AccountCountry || ''
            };
            
            setFormData(updatedFormData);
            
            // Clear any billing errors since we're copying valid account data
            const newErrors = { ...errors };
            Object.keys(newErrors).forEach(key => {
                if (key.startsWith('AccountBillTo')) {
                    delete newErrors[key];
                }
            });
            setErrors(newErrors);
        }
    };

    const handleAutofillTestData = () => {
        const testData: Partial<SubscriptionData> = {
            // Account Information
            RunId: 10,
            AccountId: getAccountId(),
            AccountFirstName: 'John',
            AccountLastName: 'Doe',
            AccountEmail: 'john.doe@example.com',
            AccountPhone: '(555)123-4567',
            AccountAddress1: '123 Main Street',
            AccountAddress2: 'Apt 4B',
            AccountCity: 'New York',
            AccountState: 'NY',
            AccountPostalCode: '10001',
            AccountCountry: 'US',
            AccountType: 'Individual',
            
            // Billing Information
            AccountBillToName: 'Nate Post',
            AccountBillToFirstName: 'Nate',
            AccountBillToLastName: 'Post',
            AccountBillToEmail: 'post@example.com',
            AccountBillToPhone: '(555)987-6543',
            AccountBillToAddress1: '456 Billing Ave',
            AccountBillToAddress2: 'Suite 200',
            AccountBillToCity: 'Vancouver',
            AccountBillToState: 'BC',
            AccountBillToPostalCode: 'V6B 2W2',
            AccountBillToCountry: 'CA',
            
            // Subscription Information
            SubscriptionName: 'Premium Parking Package',
            SubscriptionType: 'TERMED',
            SubscriptionEffectiveDate: new Date('2025-08-01'),
            SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
            SubscriptionDefaultLanguage: 'EN_CA',
            SubscriptionTaxNumber1: '12-3456789',
            SubscriptionTaxNumber2: '987-65-4321',
            
            // Member Information
            SubscriptionMemberId: 1,
            SubscriptionMemberFirstName: 'Jane',
            SubscriptionMemberLastName: 'Smith',
            SubscriptionMemberEmail: 'jane.smith@example.com',
            SubscriptionMemberPhone: '(555)555-0123',
            SubscriptionMemberRateplanName: 'Standard Monthly Plan',
            
            // subscription plans
            subscriptionPlans: [
                {
                    SubscriptionId: 1,
                    SubscriptionName: 'Standard Monthly Plan',
                    SubscriptionType: 'TERMED',
                    SubscriptionEffectiveDate: new Date('2025-08-01'),
                    SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                },
                {
                    SubscriptionId: 2,
                    SubscriptionName: 'Premium Yearly Plan',
                    SubscriptionType: 'TERMED',
                    SubscriptionEffectiveDate: new Date('2025-08-01'),
                    SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                }
            ],


            // Access Codes (new dynamic structure)
            accessCodes: [
                {
                    code: 'ABC123',
                    type: 'PROXCARD'
                },
                {
                    code: 'DEF456',
                    type: 'PERMIT'
                },
                {
                    code: 'GHI789',
                    type: 'PROXCARD'
                }
            ],
            
            // Assigned Units (new dynamic structure)
            assignedUnits: [
                {
                    unit: 'A101'
                }
            ],

            // Vehicles (new dynamic structure)
            vehicles: [
                {
                    id: 'v1',
                    name: 'Primary Car',
                    plateNumber: 'ABC123',
                    make: 'Toyota',
                    model: 'Camry',
                    color: 'Blue',
                    state: 'NY'
                },
                {
                    id: 'v2',
                    name: 'Secondary Car',
                    plateNumber: 'XYZ789',
                    make: 'Honda',
                    model: 'Civic',
                    color: 'Red',
                    state: 'BC'
                },
                {
                    id: 'v3',
                    name: 'Work Truck',
                    plateNumber: 'TRK456',
                    make: 'Ford',
                    model: 'F150',
                    color: 'White',
                    state: 'CA'
                }
            ],
            
            // Legacy fields for backward compatibility
            SubscriptionAccessCode1: 'ABC123',
            SubscriptionAccessCodeType1: 'PROXCARD',
            SubscriptionAccessCode2: 'DEF456',
            SubscriptionAccessCodeType2: 'PERMIT',
            SubscriptionAccessCode3: 'GHI789',
            SubscriptionAccessCodeType3: 'PROXCARD',
            
            // Assigned Units
            SubscriptionMemberAssignedUnit1: 'A101',
            SubscriptionMemberAssignedUnit2: 'B205',
            SubscriptionMemberAssignedUnit3: 'C303',
            
            // Vehicle Information
            SubscriptionMemberVehicle1Name: 'Primary Car',
            SubscriptionMemberVehicle1PlateNumber: 'ABC123',
            SubscriptionMemberVehicle1Make: 'Toyota',
            SubscriptionMemberVehicle1Model: 'Camry',
            SubscriptionMemberVehicle1Color: 'Blue',
            SubscriptionMemberVehicle1State: 'NY',
            
            SubscriptionMemberVehicle2Name: 'Secondary Car',
            SubscriptionMemberVehicle2PlateNumber: 'XYZ789',
            SubscriptionMemberVehicle2Make: 'Honda',
            SubscriptionMemberVehicle2Model: 'Civic',
            SubscriptionMemberVehicle2Color: 'Red',
            SubscriptionMemberVehicle2State: 'BC',
            
            SubscriptionMemberVehicle3Name: 'Work Truck',
            SubscriptionMemberVehicle3PlateNumber: 'TRK456',
            SubscriptionMemberVehicle3Make: 'Ford',
            SubscriptionMemberVehicle3Model: 'F150',
            SubscriptionMemberVehicle3Color: 'White',
            SubscriptionMemberVehicle3State: 'CA'
        };
        
        setFormData(testData);
        
        // Clear all errors when autofilling
        setErrors({});
        window.scrollTo({ top: 2098, behavior: 'smooth' });
    };

    // Download Data Template
    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([ACCOUNT_TEMPLATE_HEADERS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'AccountTemplate');
        XLSX.writeFile(wb, 'AccountDataTemplate.xlsx');
    };

    // Import Account Data
    const handleImportAccountData = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImportError(null);
        setImportSuccess(null);
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            if (!data) return;
            try {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                if (rows.length < 2) throw new Error('No data found in file.');
                const header = (rows[0] as any[]).map((h: any) => (h || '').toString().trim().toLowerCase());
                const row = rows[1];
                const get = (col: string) => {
                    const idx = header.indexOf(col.toLowerCase());
                    return idx !== -1 ? row[idx] : '';
                };
                // Validate required columns
                const requiredCols = ['firstname','lastname','email','phone','address 1','city','state','country','zipcode','use account address as billing address? (y/n)'];
                for (const col of requiredCols) {
                    if (!header.includes(col)) throw new Error(`Missing required column: ${col}`);
                }
                // Map Excel columns to form fields
                setFormData(prev => {
                    const useBilling = (get('use account address as billing address? (y/n)') || '').toString().toUpperCase().startsWith('Y');
                    let parsedAccountId: number | undefined = undefined;
                    const rawAccountId = prev.AccountId ?? get('accountid') ?? '';
                    if (typeof rawAccountId === 'number') {
                        parsedAccountId = rawAccountId;
                    } else if (typeof rawAccountId === 'string' && rawAccountId.trim() !== '' && !isNaN(Number(rawAccountId))) {
                        parsedAccountId = Number(rawAccountId);
                    }
                    return {
                        ...prev,
                        AccountId: parsedAccountId,
                        AccountFirstName: get('firstname') || '',
                        AccountLastName: get('lastname') || '',
                        AccountEmail: get('email') || '',
                        AccountPhone: get('phone') || '',
                        AccountAddress1: get('address 1') || '',
                        AccountAddress2: get('address 2') || '',
                        AccountCity: get('city') || '',
                        AccountState: get('state') || '',
                        AccountCountry: get('country') || '',
                        AccountPostalCode: get('zipcode') || '',
                        AccountType: prev.AccountType || '',
                        // Billing info
                        AccountBillToName: useBilling ? `${get('firstname') || ''} ${get('lastname') || ''}`.trim() : '',
                        AccountBillToFirstName: useBilling ? get('firstname') || '' : '',
                        AccountBillToLastName: useBilling ? get('lastname') || '' : '',
                        AccountBillToEmail: useBilling ? get('email') || '' : '',
                        AccountBillToPhone: useBilling ? get('phone') || '' : '',
                        AccountBillToAddress1: useBilling ? get('address 1') || '' : '',
                        AccountBillToAddress2: useBilling ? get('address 2') || '' : '',
                        AccountBillToCity: useBilling ? get('city') || '' : '',
                        AccountBillToState: useBilling ? get('state') || '' : '',
                        AccountBillToCountry: useBilling ? get('country') || '' : '',
                        AccountBillToPostalCode: useBilling ? get('zipcode') || '' : '',
                    };
                });
                // Automatically check or uncheck the billing checkbox
                const useBilling = (get('use account address as billing address? (y/n)') || '').toString().toUpperCase().startsWith('Y');
                setCopyAccountToBilling(useBilling);
                setImportSuccess('Account data imported successfully!');
                window.scrollTo({ top: 200, behavior: 'smooth' });
            } catch (err: any) {
                setImportError(err.message || 'Failed to import account data.');
            }
        };
        reader.readAsBinaryString(file);
    };

    {/*
    const validateAccountFields = () => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        // Required fields validation for Account Information
        const requiredFields: (keyof SubscriptionData)[] = [
            'AccountId', 'AccountFirstName', 'AccountLastName', 'AccountEmail',
            'AccountState', 'AccountPostalCode', 'AccountCountry', 'AccountType',
        ];

        requiredFields.forEach(field => {
            const value = formData[field];
            const error = validateField(field, value);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(prev => ({ ...prev, ...newErrors }));
        return isValid;
    };

    const validateBillingFields = () => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        // Required fields validation for Billing Information
        const requiredFields: (keyof SubscriptionData)[] = [
            'AccountBillToName', 'AccountBillToFirstName', 'AccountBillToLastName', 
            'AccountBillToEmail', 'AccountBillToState', 'AccountBillToCountry',
        ];

        requiredFields.forEach(field => {
            const value = formData[field];
            const error = validateField(field, value);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(prev => ({ ...prev, ...newErrors }));
        return isValid;
    };

    const handleAccountNext = () => {
        if (validateAccountFields()) {
            // Move to Billing Information section
            const billingSection = document.getElementById('billing-section');
            if (billingSection) {
                billingSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const handleBillingNext = () => {
        if (validateBillingFields()) {
            // Move to Subscription Plans section
            const subscriptionSection = document.getElementById('subscription-section');
            if (subscriptionSection) {
                subscriptionSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // --- BILLING STATE/PROVINCE AUTOCOMPLETE ---
    const billingStateOptions = formData.AccountBillToCountry === 'US'
        ? states
        : formData.AccountBillToCountry === 'CA'
            ? provinces
            : [...states, ...provinces];
    */}
    return (
        <ThemeProvider theme={companyTheme}>
            {/* Background */}
            <Box
                sx={{
                    minHeight: '100vh',
                    width: '100vw',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: -1,
                    background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                    overflow: 'hidden',
                }}
            >
                {/* Geometric overlays */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -120,
                        left: -120,
                        width: 600,
                        height: 600,
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '40% 60% 70% 30%/60% 40% 60% 40%',
                        transform: 'rotate(-15deg)',
                        zIndex: 1,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -100,
                        right: -100,
                        width: 500,
                        height: 500,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '60% 40% 30% 70%/40% 60% 40% 60%',
                        transform: 'rotate(10deg)',
                        zIndex: 1,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -350,
                        left: -150,
                        width: 500,
                        height: 700,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '60% 40% 30% 70%/40% 60% 40% 60%',
                        transform: 'rotate(110deg)',
                        zIndex: 1,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: -400,
                        right: 100,
                        width: 500,
                        height: 700,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '60% 40% 30% 70%/40% 60% 40% 60%',
                        transform: 'rotate(125deg)',
                        zIndex: 1,
                    }}
                />
            </Box>

            {/* Main Form Container */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '40px 20px',
                }}
            >
                <form onSubmit={handleSubmit}>
                    {/* Validation Summary */}
                    {Object.keys(errors).length > 0 && Object.values(errors).some(error => error !== '') && (
                        <Alert severity="error" sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Please fix the following errors:</Typography>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {Object.entries(errors).map(([field, error]) => 
                                    error && (
                                        <li key={field}>
                                            <strong>{field.replace(/([A-Z])/g, ' $1').trim()}:</strong> {error}
                                        </li>
                                    )
                                )}
                            </ul>
                        </Alert>
                    )}

                    {/* Test Data Autofill Button */}
                    <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
                        Subscription Onboarding Form
                    </Typography>
                    <Box sx={{ my: 2, ml: .5,  display: 'flex', justifyContent: 'left' }}>
                        <Button
                            variant="contained"
                            onClick={handleAutofillTestData}
                            color="warning"
                            sx={{
                                fontWeight: 650,
                                px: 4,
                                py: 1.5,
                            }}
                            size="small"
                        >
                            📝 Fill Test Data
                        </Button>
                        <Button
                            variant="contained"
                            onClick={resetAccountIdCounter}
                            color="warning"
                            sx={{
                                fontWeight: 650,
                                px: 4,
                                py: 1.5,
                                ml: 2
                            }}
                            size="small"
                        >
                            Reset Account ID 
                        </Button>
                    </Box>

                    {/* --- TOP OF FORM: Data Template Download & Import UI --- */}
                    <Paper sx={{ p: 4, my: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600, mr: 1 }}>
                                Data Template and Import
                            </Typography>
                            <Tooltip title="Download the data template, copy and paste your account information, save the file, then import the data">
                                <InfoIcon sx={{ color: '#007dba', fontSize: 20 }} />
                            </Tooltip>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleDownloadTemplate}
                                sx={{ fontWeight: 600 }}
                            >
                                Download Data Template
                            </Button>
                            <label htmlFor="import-account-data" style={{ marginBottom: 0 }}>
                                <input
                                    id="import-account-data"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    style={{ display: 'none' }}
                                    onChange={handleImportAccountData}
                                />
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    component="span"
                                    sx={{ fontWeight: 600 }}
                                >
                                    Import Account Data
                                </Button>
                            </label>
                            {importError && (
                                <Alert severity="error" sx={{ ml: 2 }}>{importError}</Alert>
                            )}
                            {importSuccess && (
                                <Alert severity="success" sx={{ ml: 2 }}>{importSuccess}</Alert>
                            )}
                        </Box>
                    </Paper>

                    {/* Account Information Section */}
                    <Paper sx={{ p: 4, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600, mr: 1 }}>
                                Account Information
                            </Typography>
                            <Tooltip title="Account holder information and billing details">
                                <InfoIcon sx={{ color: '#007dba', fontSize: 20 }} />
                            </Tooltip>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ flexBasis: { xs: '100%', md: '15%' }, minWidth: 120 }}>
                                <TextField
                                    fullWidth
                                    label="Account ID *"
                                    type="number"
                                    value={getAccountId()}
                                    onChange={(e) => handleInputChange('AccountId', parseInt(e.target.value))}
                                    error={!!errors.AccountId}
                                    helperText={errors.AccountId}
                                    disabled
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={formData.AccountFirstName || ''}
                                    onChange={(e) => handleInputChange('AccountFirstName', e.target.value)}
                                    error={!!errors.AccountFirstName}
                                    helperText={errors.AccountFirstName}
                                    required
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    value={formData.AccountLastName || ''}
                                    onChange={(e) => handleInputChange('AccountLastName', e.target.value)}
                                    error={!!errors.AccountLastName}
                                    helperText={errors.AccountLastName}
                                    required
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '48%' }, minWidth: 250 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={formData.AccountEmail || ''}
                                    onChange={(e) => handleInputChange('AccountEmail', e.target.value)}
                                    error={!!errors.AccountEmail}
                                    helperText={errors.AccountEmail}
                                    required
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '48%' }, minWidth: 250 }}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={formData.AccountPhone || ''}
                                    onChange={(e) => handlePhoneChange('AccountPhone', e.target.value)}
                                    error={!!errors.AccountPhone}
                                    helperText={errors.AccountPhone || 'Format: (XXX)XXX-XXXX'}
                                    placeholder="(XXX)XXX-XXXX"
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '65%' }, minWidth: 300 }}>
                                <TextField
                                    fullWidth
                                    label="Address Line 1"
                                    value={formData.AccountAddress1 || ''}
                                    onChange={(e) => handleInputChange('AccountAddress1', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="Address Line 2"
                                    value={formData.AccountAddress2 || ''}
                                    onChange={(e) => handleInputChange('AccountAddress2', e.target.value)}
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <Autocomplete
                                    fullWidth
                                    options={
                                        formData.AccountCountry === 'US'
                                            ? states
                                            : formData.AccountCountry === 'CA'
                                                ? provinces
                                                : [...states, ...provinces]
                                    }
                                    value={formData.AccountState || ''}
                                    onChange={(_, newValue) => {
                                        handleInputChange('AccountState', newValue || '');
                                    }}
                                    renderInput={(params) => {
                                        let stateLabel = "State/Province";
                                        if (formData.AccountCountry === 'US') stateLabel = "State";
                                        else if (formData.AccountCountry === 'CA') stateLabel = "Province";
                                        return (
                                            <TextField
                                                {...params}
                                                label={stateLabel}
                                                error={!!errors.AccountState}
                                                helperText={errors.AccountState}
                                                required
                                            />
                                        );
                                    }}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <TextField
                                    fullWidth
                                    label="City"
                                    value={formData.AccountCity || ''}
                                    onChange={(e) => handleInputChange('AccountCity', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <TextField
                                    fullWidth
                                    label="Postal Code"
                                    value={formData.AccountPostalCode || ''}
                                    onChange={(e) => handleInputChange('AccountPostalCode', e.target.value)}
                                    error={!!errors.AccountPostalCode}
                                    helperText={errors.AccountPostalCode || 'US: 12345 or 12345-6789, CA: A1A 1A1'}
                                    placeholder="12345 or A1A 1A1"
                                    required
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <FormControl fullWidth error={!!errors.AccountCountry}>
                                    <InputLabel>Country *</InputLabel>
                                    <Select
                                        value={formData.AccountCountry || ''}
                                        onChange={(e: SelectChangeEvent) => handleInputChange('AccountCountry', e.target.value)}
                                        label="Country *"
                                        required
                                    >
                                        {countries.map((country) => (
                                            <MenuItem key={country} value={country}>{country}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.AccountCountry && <FormHelperText>{errors.AccountCountry}</FormHelperText>}
                                </FormControl>
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '48%' }, minWidth: 250 }}>
                                <FormControl fullWidth error={!!errors.AccountType}>
                                    <InputLabel>Account Type *</InputLabel>
                                    <Select
                                        value={formData.AccountType || ''}
                                        onChange={(e: SelectChangeEvent) => handleInputChange('AccountType', e.target.value)}
                                        label="Account Type *"
                                        required
                                    >
                                        {accountTypes.map((type) => (
                                            <MenuItem key={type} value={type}>{type}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.AccountType && <FormHelperText>{errors.AccountType}</FormHelperText>}
                                </FormControl>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Billing Information Section */}
                    <Paper sx={{ p: 4, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600, mr: 1 }}>
                                Billing Information
                            </Typography>
                            <Tooltip title="Billing contact and address information">
                                <InfoIcon sx={{ color: '#007dba', fontSize: 20 }} />
                            </Tooltip>
                            {/* Copy Account Info Checkbox */}
                            <Box sx={{ ml: 4, flexGrow: 1, mt: .5 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={copyAccountToBilling}
                                            onChange={(e) => handleCopyAccountToBilling(e.target.checked)}
                                            sx={{ 
                                                color: '#007dba',
                                                '&.Mui-checked': {
                                                    color: '#007dba',
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography sx={{ color: '#007dba', fontWeight: 500 }}>
                                            Same as account information
                                        </Typography>
                                    }
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="Bill To Name"
                                    value={formData.AccountBillToName || ''}
                                    onChange={(e) => handleInputChange('AccountBillToName', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToName}
                                    helperText={errors.AccountBillToName}
                                    required
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={formData.AccountBillToFirstName || ''}
                                    onChange={(e) => handleInputChange('AccountBillToFirstName', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToFirstName}
                                    helperText={errors.AccountBillToFirstName}
                                    required
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    value={formData.AccountBillToLastName || ''}
                                    onChange={(e) => handleInputChange('AccountBillToLastName', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToLastName}
                                    helperText={errors.AccountBillToLastName}
                                    required
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '48%' }, minWidth: 250 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={formData.AccountBillToEmail || ''}
                                    onChange={(e) => handleInputChange('AccountBillToEmail', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToEmail}
                                    helperText={errors.AccountBillToEmail}
                                    required
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '48%' }, minWidth: 250 }}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={formData.AccountBillToPhone || ''}
                                    onChange={(e) => handlePhoneChange('AccountBillToPhone', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToPhone}
                                    helperText={errors.AccountBillToPhone || 'Format: (XXX)XXX-XXXX'}
                                    placeholder="(XXX)XXX-XXXX"
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '65%' }, minWidth: 300 }}>
                                <TextField
                                    fullWidth
                                    label="Address 1"
                                    value={formData.AccountBillToAddress1 || ''}
                                    onChange={(e) => handleInputChange('AccountBillToAddress1', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToAddress1}
                                    helperText={errors.AccountBillToAddress1}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="Address 2"
                                    value={formData.AccountBillToAddress2 || ''}
                                    onChange={(e) => handleInputChange('AccountBillToAddress2', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToAddress2}
                                    helperText={errors.AccountBillToAddress2}
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <Autocomplete
                                    fullWidth
                                    options={states}
                                    value={formData.AccountBillToState || ''}
                                    onChange={(_, newValue) => {
                                        handleInputChange('AccountBillToState', newValue || '');
                                    }}
                                    disabled={copyAccountToBilling}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="State *"
                                            error={!!errors.AccountBillToState}
                                            helperText={errors.AccountBillToState}
                                            required
                                        />
                                    )}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <TextField
                                    fullWidth
                                    label="City"
                                    value={formData.AccountBillToCity || ''}
                                    onChange={(e) => handleInputChange('AccountBillToCity', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToCity}
                                    helperText={errors.AccountBillToCity}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <TextField
                                    fullWidth
                                    label="Postal Code"
                                    value={formData.AccountBillToPostalCode || ''}
                                    onChange={(e) => handleInputChange('AccountBillToPostalCode', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToPostalCode}
                                    helperText={errors.AccountBillToPostalCode || 'US: 12345 or 12345-6789, CA: A1A 1A1'}
                                    placeholder="12345 or A1A 1A1"
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <FormControl fullWidth disabled={copyAccountToBilling} error={!!errors.AccountBillToCountry}>
                                    <InputLabel>Country *</InputLabel>
                                    <Select
                                        value={formData.AccountBillToCountry || ''}
                                        onChange={(e: SelectChangeEvent) => handleInputChange('AccountBillToCountry', e.target.value)}
                                        label="Country *"
                                        required
                                    >
                                        {countries.map((country) => (
                                            <MenuItem key={country} value={country}>{country}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.AccountBillToCountry && <FormHelperText>{errors.AccountBillToCountry}</FormHelperText>}
                                </FormControl>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Subscription Plans Section */}
                    <Paper sx={{ p: 4, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600, mr: 1 }}>
                                Subscription Plans
                            </Typography>
                            <Tooltip title="Add one or more subscription plans for this account">
                                <InfoIcon sx={{ color: '#007dba', fontSize: 20 }} />
                            </Tooltip>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    const now = new Date();
                                    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                                    setFormData(prev => {
                                        const nextId = ((prev.subscriptionPlans?.length || 0) + 1);
                                        const newPlan = {
                                            id: generateId(),
                                            SubscriptionId: nextId,
                                            SubscriptionName: '',
                                            SubscriptionType: 'EVERGREEN',
                                            SubscriptionEffectiveDate: firstOfMonth,
                                            SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                                        };
                                        return {
                                            ...prev,
                                            subscriptionPlans: [
                                                ...(prev.subscriptionPlans || []),
                                                newPlan
                                            ]
                                        };
                                    });
                                }}
                                sx={{
                                    ml: 3,
                                    backgroundColor: '#007dba',
                                    '&:hover': { backgroundColor: '#005a94' },
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    px: 2,
                                    py: 1
                                }}
                            >
                                Add Subscription
                            </Button>
                        </Box>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                        <TableCell width="40px" align="center"></TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Subscription ID</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Effective Date</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Invoice Template</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(formData.subscriptionPlans || []).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography variant="body2" color="text.secondary">
                                                    No subscription plans added yet. Click "Add Subscription" to get started.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {(formData.subscriptionPlans || []).map((plan: any) => (
                                        <TableRow key={plan.id}>
                                            <TableCell align="center">
                                                <IconButton
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            subscriptionPlans: (prev.subscriptionPlans || []).filter((p: any) => p.id !== plan.id)
                                                        }));
                                                    }}
                                                    size="small"
                                                    sx={{ color: '#B20838' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    sx={{ width: "100px" }}
                                                    size="small"
                                                    type="number"
                                                    value={plan.SubscriptionId || ''}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            subscriptionPlans: (prev.subscriptionPlans || []).map((p: any) =>
                                                                p.id === plan.id ? { ...p, SubscriptionId: value } : p
                                                            )
                                                        }));
                                                    }}
                                                    required
                                                    disabled
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={plan.SubscriptionName || ''}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            subscriptionPlans: (prev.subscriptionPlans || []).map((p: any) =>
                                                                p.id === plan.id ? { ...p, SubscriptionName: value } : p
                                                            )
                                                        }));
                                                    }}
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={plan.SubscriptionType || ''}
                                                        onChange={e => {
                                                            const value = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                subscriptionPlans: (prev.subscriptionPlans || []).map((p: any) =>
                                                                    p.id === plan.id ? { ...p, SubscriptionType: value } : p
                                                                )
                                                            }));
                                                        }}
                                                        required
                                                    >
                                                        {subscriptionTypes.map(type => (
                                                            <MenuItem key={type} value={type}>{type}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type="date"
                                                    value={
                                                        plan.SubscriptionEffectiveDate
                                                            ? (plan.SubscriptionEffectiveDate instanceof Date
                                                                ? plan.SubscriptionEffectiveDate.toISOString().split('T')[0]
                                                                : typeof plan.SubscriptionEffectiveDate === 'string'
                                                                    ? plan.SubscriptionEffectiveDate.split('T')[0]
                                                                    : '')
                                                            : ''
                                                    }
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            subscriptionPlans: (prev.subscriptionPlans || []).map((p: any) =>
                                                                p.id === plan.id ? { ...p, SubscriptionEffectiveDate: value } : p
                                                            )
                                                        }));
                                                    }}
                                                    InputLabelProps={{ shrink: true }}
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={plan.SubscriptionInvoiceTemplate || ''}
                                                        onChange={e => {
                                                            const value = e.target.value;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                subscriptionPlans: (prev.subscriptionPlans || []).map((p: any) =>
                                                                    p.id === plan.id ? { ...p, SubscriptionInvoiceTemplate: value } : p
                                                                )
                                                            }));
                                                        }}
                                                        required
                                                    >
                                                        {invoiceTemplates.map(template => (
                                                            <MenuItem key={template} value={template}>{template}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Member Information Section */}
                    <Paper sx={{ p: 4, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600, mr: 1 }}>
                                Member Information
                            </Typography>
                            <Tooltip title="Subscription member details and access codes">
                                <InfoIcon sx={{ color: '#007dba', fontSize: 20 }} />
                            </Tooltip>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ flexBasis: { xs: '100%', md: 'auto' }, minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Member ID"
                                    type="number"
                                    value={1}
                                    onChange={(e) => handleInputChange('SubscriptionMemberId', parseInt(e.target.value))}
                                    required
                                    disabled
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: 'auto' }, minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Member First Name"
                                    value={ formData.SubscriptionMemberFirstName || ''}
                                    onChange={(e) => handleInputChange('SubscriptionMemberFirstName', e.target.value)}
                                    required
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: 'auto' }, minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Member Last Name"
                                    value={formData.SubscriptionMemberLastName || ''}
                                    onChange={(e) => handleInputChange('SubscriptionMemberLastName', e.target.value)}
                                    required
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: 'auto' }, minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Member Email"
                                    type="email"
                                    value={formData.SubscriptionMemberEmail || ''}
                                    onChange={(e) => handleInputChange('SubscriptionMemberEmail', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: 'auto' }, minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Member Phone"
                                    value={ formData.SubscriptionMemberPhone || ''}
                                    onChange={(e) => handlePhoneChange('SubscriptionMemberPhone', e.target.value)}
                                    error={!!errors.SubscriptionMemberPhone}
                                    helperText={errors.SubscriptionMemberPhone || 'Format: (XXX)XXX-XXXX'}
                                    placeholder="(XXX)XXX-XXXX"
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: 'auto' }, minWidth: 200, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Member Rate Plan Name"
                                    value={formData.SubscriptionMemberRateplanName || ''}

                                    onChange={(e) => handleInputChange('SubscriptionMemberRateplanName', e.target.value)}
                                    required
                                />
                            </Box>
                            {/* Access Codes and Assigned Units - Side by Side */}
                            <Box sx={{ display: 'flex', gap: 3, width: '100%' }}>
                                {/* Access Codes Table */}
                                <Box sx={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#007dba' }}>
                                            Access Codes
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={addAccessCode}
                                            sx={{
                                                backgroundColor: '#007dba',
                                                '&:hover': { backgroundColor: '#005a94' },
                                                borderRadius: '8px',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                px: 2,
                                                py: 1
                                            }}
                                            disabled={(formData.accessCodes || []).length >= 3}
                                        >
                                            Add Code
                                        </Button>
                                    </Box>
                                    {(formData.accessCodes || []).length >= 3 && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            You can only add up to 3 access codes.
                                        </Alert>
                                    )}
                                    {(formData.accessCodes || []).length > 0 && (
                                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                                        <TableCell width="30px" align="center"></TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Code</TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Type</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {(formData.accessCodes || []).map((accessCode) => (
                                                        <TableRow key={accessCode.id}>
                                                            <TableCell align="center">
                                                                <IconButton
                                                                    onClick={() => removeAccessCode(accessCode.id)}
                                                                    size="small"
                                                                    sx={{ color: '#B20838' }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField
                                                                    fullWidth
                                                                    size="small"
                                                                    value={accessCode.code}
                                                                    onChange={(e) => updateAccessCode(accessCode.id, 'code', e.target.value)}
                                                                    placeholder="Enter code"
                                                                    variant="outlined"
                                                                    sx={{ minWidth: 100 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormControl fullWidth size="small" sx={{ minWidth: 100 }}>
                                                                    <Select
                                                                        value={accessCode.type}
                                                                        onChange={(e: SelectChangeEvent) => updateAccessCode(accessCode.id, 'type', e.target.value)}
                                                                        displayEmpty
                                                                    >
                                                                        <MenuItem value="">
                                                                            <em>Type</em>
                                                                        </MenuItem>
                                                                        {accessCodeTypes.map((type) => (
                                                                            <MenuItem key={type} value={type}>{type}</MenuItem>
                                                                        ))}
                                                                    </Select>
                                                                </FormControl>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                    {(formData.accessCodes || []).length === 0 && (
                                        <Box sx={{
                                            textAlign: 'center',
                                            py: 3,
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: 2,
                                            border: '2px dashed #dee2e6'
                                        }}>
                                            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                                                No access codes added yet. Click "Add Code" to get started.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Assigned Units Table */}
                                <Box sx={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#007dba' }}>
                                            Assigned Units
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={addAssignedUnit}
                                            sx={{
                                                backgroundColor: '#007dba',
                                                '&:hover': { backgroundColor: '#005a94' },
                                                borderRadius: '8px',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                px: 2,
                                                py: 1
                                            }}
                                            disabled={(formData.assignedUnits || []).length >= 1}
                                        >
                                            Add Unit
                                        </Button>
                                    </Box>
                                    {(formData.assignedUnits || []).length >= 1 && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            You can only add 1 assigned unit.
                                        </Alert>
                                    )}
                                    {(formData.assignedUnits || []).length > 0 && (
                                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                                        <TableCell width="30px" align="center"></TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Unit</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {(formData.assignedUnits || []).map((unit) => (
                                                        <TableRow key={unit.id}>
                                                            <TableCell align="center">
                                                                <IconButton
                                                                    onClick={() => removeAssignedUnit(unit.id)}
                                                                    size="small"
                                                                    sx={{ color: '#B20838' }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField
                                                                    fullWidth
                                                                    size="small"
                                                                    value={unit.unit}
                                                                    onChange={(e) => updateAssignedUnit(unit.id, 'unit', e.target.value)}
                                                                    placeholder="Unit"
                                                                    variant="outlined"
                                                                    sx={{ minWidth: 100 }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                    {(formData.assignedUnits || []).length === 0 && (
                                        <Box sx={{
                                            textAlign: 'center',
                                            py: 3,
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: 2,
                                            border: '2px dashed #dee2e6'
                                        }}>
                                            <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                                                No assigned units added yet. Click "Add Unit" to get started.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Vehicle Information Section */}
                    <Paper sx={{ p: 4, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600, mr: 1 }}>
                                Vehicle Registration
                            </Typography>
                            <Tooltip title="Member vehicle details and registration information">
                                <InfoIcon sx={{ color: '#007dba', fontSize: 20 }} />
                            </Tooltip>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ flexBasis: { xs: '100%', md: 'auto' }, minWidth: 200, flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6" sx={{ color: '#007dba' }}>
                                        Vehicles
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={addVehicle}
                                        sx={{
                                            backgroundColor: '#007dba',
                                            '&:hover': { backgroundColor: '#005a94' },
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            fontWeight: 600
                                        }}
                                        disabled={(formData.vehicles || []).length >= 3}
                                    >
                                        Add New Vehicle
                                    </Button>
                                </Box>
                                {(formData.vehicles || []).length >= 3 && (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        You can only add up to 3 vehicles.
                                    </Alert>
                                )}
                                {(formData.vehicles || []).length > 0 && (
                                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                                    <TableCell width="40px" align="center"></TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Plate Number</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Make</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Model</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>Color</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#007dba' }}>State</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(formData.vehicles || []).map((vehicle) => (
                                                    <TableRow key={vehicle.id}>
                                                        <TableCell align="center">
                                                            <IconButton
                                                                onClick={() => removeVehicle(vehicle.id)}
                                                                size="small"
                                                                sx={{ color: '#B20838' }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                value={vehicle.name}
                                                                onChange={(e) => updateVehicle(vehicle.id, 'name', e.target.value)}
                                                                placeholder="Vehicle name"
                                                                variant="outlined"
                                                                sx={{ minWidth: 120 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                value={vehicle.plateNumber}
                                                                onChange={(e) => updateVehicle(vehicle.id, 'plateNumber', e.target.value)}
                                                                placeholder="License plate"
                                                                variant="outlined"
                                                                sx={{ minWidth: 120 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                value={vehicle.make}
                                                                onChange={(e) => updateVehicle(vehicle.id, 'make', e.target.value)}
                                                                placeholder="Make"
                                                                variant="outlined"
                                                                sx={{ minWidth: 100 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                value={vehicle.model}
                                                                onChange={(e) => updateVehicle(vehicle.id, 'model', e.target.value)}
                                                                placeholder="Model"
                                                                variant="outlined"
                                                                sx={{ minWidth: 100 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Autocomplete
                                                                fullWidth
                                                                size="small"
                                                                freeSolo
                                                                options={vehicleColors}
                                                                value={vehicle.color}
                                                                onChange={(_, newValue) => {
                                                                    updateVehicle(vehicle.id, 'color', newValue || '');
                                                                }}
                                                                onInputChange={(_, newInputValue) => {
                                                                    updateVehicle(vehicle.id, 'color', newInputValue);
                                                                }}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        placeholder="Color"
                                                                        variant="outlined"
                                                                        sx={{ minWidth: 100 }}
                                                                    />
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Autocomplete
                                                                fullWidth
                                                                size="small"
                                                                options={states}
                                                                value={vehicle.state}
                                                                onChange={(_, newValue) => {
                                                                    updateVehicle(vehicle.id, 'state', newValue || '');
                                                                }}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        placeholder="State"
                                                                        variant="outlined"
                                                                        sx={{ minWidth: 80 }}
                                                                    />
                                                                )}
                                                            />
                                                        </TableCell>
                                                        
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                
                                {(formData.vehicles || []).length === 0 && (
                                    <Box sx={{ 
                                        textAlign: 'center', 
                                        py: 4, 
                                        backgroundColor: '#f8f9fa', 
                                        borderRadius: 2,
                                        border: '2px dashed #dee2e6'
                                    }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No vehicles added yet. Click "Add New Vehicle" to get started.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Paper>

                    {/* Submit Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            sx={{
                                px: 6,
                                py: 2,
                                fontSize: '1.1rem',
                                background: 'linear-gradient(45deg, #007dba 30%, #2196f3 90%)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #005a85 30%, #1976d2 90%)',
                                },
                            }}
                        >
                            Create Subscription
                        </Button>
                    </Box>
                </form>
            </Box>
        </ThemeProvider>
    );
};


export default SubscriptionForm;

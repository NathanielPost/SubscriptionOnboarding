import React, { useState, useEffect } from 'react';
import { SubscriptionData, AccessCode, AssignedUnit, Vehicle } from '../types/subscription';
import * as XLSX from 'xlsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert, SelectChangeEvent,
  Autocomplete, Tooltip, Checkbox, FormControlLabel, Chip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SubscriptionPlan } from '../types/subscription'; // Adjust the path as needed


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
            const now = new Date();
            setAccounts([{
                RunId: 10,
                AccountId: getAccountId(),
                subscriptionPlans: [
                    {
                        SubscriptionId: 1,
                        SubscriptionName: '',
                        SubscriptionType: 'EVERGREEN',
                        SubscriptionEffectiveDate: new Date(now.getFullYear(), now.getMonth(), 1),
                        SubscriptionInvoiceTemplate: 'lAZ_STANDARD',
                        SubscriptionMembers: [{
                            SubscriptionMemberId: 1,
                            SubscriptionMemberFirstName: '',
                            SubscriptionMemberLastName: '',
                            SubscriptionMemberEmail: '',
                            SubscriptionMemberPhone: '',
                            SubscriptionMemberRateplanName: '',
                            
                        }],
                        accessCodes: [],
                        assignedUnits: [],
                        vehicles: []
                    }
                ],
            }]);
            setActiveAccountIndex(0);
            setErrors({});
            setCopyAccountToBilling(false);
            setImportError(null);
            setImportSuccess(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const [accounts, setAccounts] = useState<Partial<SubscriptionData>[]>([
    {
        RunId: 10,
        AccountId: getAccountId(), // Use a function to get the next account ID
        subscriptionPlans: [
            {
                SubscriptionId: 1,
                SubscriptionName: '',
                SubscriptionType: 'EVERGREEN',
                SubscriptionEffectiveDate: new Date(),
                SubscriptionInvoiceTemplate: 'lAZ_STANDARD',
                SubscriptionMembers: [],
                accessCodes: [],
                assignedUnits: [],
                vehicles: []
            }
        ] 
    }]);
    const [activeAccountIndex, setActiveAccountIndex] = useState(0);
    const currentAccount = accounts[activeAccountIndex] || {};
    const plan = currentAccount.subscriptionPlans && currentAccount.subscriptionPlans.length > 0 ? currentAccount.subscriptionPlans[0] : undefined;
    const accessCodes = plan?.accessCodes || [];
    const assignedUnits = plan?.assignedUnits || [];
    const vehicles = plan?.vehicles || [];
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [copyAccountToBilling, setCopyAccountToBilling] = useState(false);

    const duplicateAccount = (index: number) => {
        const accountToDuplicate = accounts[index];
        const newAccount = {
            ...accountToDuplicate,
            AccountId: getAccountId(), // New ID
            AccountEmail: '', // Clear unique fields
            // Clear other unique identifiers
        };
        
        setAccounts(prev => [...prev, newAccount]);
    };

    const deleteAccount = (index: number) => {
        if (accounts.length > 1) {
            setAccounts(prev => prev.filter((_, i) => i !== index));
            if (activeAccountIndex >= accounts.length - 1) {
                setActiveAccountIndex(Math.max(0, accounts.length - 2));
            }
        }
    };

    // --- TOP OF FORM: Data Template Download & Import UI ---
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);

    // Helper functions for dynamic arrays
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const addAccessCode = () => {
        if ((plan?.accessCodes || []).length >= 3) return;
        const newAccessCode: AccessCode = {
            id: generateId(),
            code: '',
            type: ''
        };
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? { ...p, accessCodes: [...(p.accessCodes || []), newAccessCode] }
                            : p
                    )
                }
                : account
        ));
    };

    const removeMember = (id: string) => {
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? { ...p, SubscriptionMembers: (p.SubscriptionMembers || []).filter(item => String(item.SubscriptionMemberId) !== id) }
                            : p
                    )
                }
                : account
        ));
    };

    const removeAccessCode = (id: string) => {
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? { ...p, accessCodes: (p.accessCodes || []).filter(item => item.id !== id) }
                            : p
                    )
                }
                : account
        ));
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
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? {
                                ...p,
                                accessCodes: (p.accessCodes || []).map(item =>
                                    item.id === id ? { ...item, [field]: value } : item
                                )
                            }
                            : p
                    )
                }
                : account
        ));
    };

    const addAssignedUnit = () => {
        if ((plan?.assignedUnits || []).length >= 1) return;
        const newUnit: AssignedUnit = {
            id: generateId(),
            unit: '',
        };
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? { ...p, assignedUnits: [...(p.assignedUnits || []), newUnit] }
                            : p
                    )
                }
                : account
        ));
    };

    const removeAssignedUnit = (id: string) => {
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? { ...p, assignedUnits: (p.assignedUnits || []).filter(item => item.id !== id) }
                            : p
                    )
                }
                : account
        ));
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
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? {
                                ...p,
                                assignedUnits: (p.assignedUnits || []).map(item =>
                                    item.id === id ? { ...item, [field]: value } : item
                                )
                            }
                            : p
                    )
                }
                : account
        ));
    };

    const addVehicle = () => {
        if ((plan?.vehicles || []).length >= 3) return;
        const newVehicle: Vehicle = {
            id: generateId(),
            name: '',
            plateNumber: '',
            make: '',
            model: '',
            color: '',
            state: ''
        };
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? { ...p, vehicles: [...(p.vehicles || []), newVehicle] }
                            : p
                    )
                }
                : account
        ));
    };

    const removeVehicle = (id: string) => {
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? { ...p, vehicles: (p.vehicles || []).filter(item => item.id !== id) }
                            : p
                    )
                }
                : account
        ));
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
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((p, planIdx) =>
                        planIdx === 0
                            ? {
                                ...p,
                                vehicles: (p.vehicles || []).map(item =>
                                    item.id === id ? { ...item, [field]: value } : item
                                )
                            }
                            : p
                    )
                }
                : account
        ));
    };

    const validateAccount = (account: any, accountIndex: number): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    
    // Add your validation logic here
    if (!account.AccountFirstName) {
        errors[`account_${accountIndex}_firstName`] = 'First name is required';
    }
    
    return errors;
};

    const validateAllAccounts = (): boolean => {
        let isValid = true;
        const newErrors: { [key: string]: string } = {};
        
        accounts.forEach((account, accountIndex) => {
            // Validate each account
            const accountErrors = validateAccount(account, accountIndex);
            Object.assign(newErrors, accountErrors);
            if (Object.keys(accountErrors).length > 0) {
                isValid = false;
            }
        });
        
        setErrors(newErrors);
        return isValid;
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
        setAccounts(prev => prev.map((account, index) => 
            index === activeAccountIndex 
                ? { ...account, [field]: value }
                : account
        ));
        
        // Update validation for active account
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [`${activeAccountIndex}_${field}`]: error }));
    };

    const addNewAccount = () => {
        changeAccountId();
        const newAccount: Partial<SubscriptionData> = {
            RunId: 10,
            AccountId: getAccountId(),
            subscriptionPlans: [
                {
                    SubscriptionId: 1,
                    SubscriptionName: '',
                    SubscriptionType: 'EVERGREEN',
                    SubscriptionEffectiveDate: new Date(),
                    SubscriptionInvoiceTemplate: 'lAZ_STANDARD',
                    SubscriptionMembers: [],
                    accessCodes: [],
                    assignedUnits: [],
                    vehicles: []
                }
            ],

        };
        
        setAccounts(prev => [...prev, newAccount]);
        setActiveAccountIndex(accounts.length); // Switch to new account
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
            const value = currentAccount[field];
            const error = validateField(field, value);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        // Validate all other fields that have values
        Object.keys(currentAccount).forEach(key => {
            const field = key as keyof SubscriptionData;
            const value = currentAccount[field];
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
    // Converts all accounts to an array of legacy-format objects (one per account)
    const convertAllAccountsToLegacyRows = (accounts: Partial<SubscriptionData>[]): any[] => {
        return accounts.map((data) => {
            const legacyData: { [key: string]: any } = { ...data };
            legacyData['AccountName'] = `${data.AccountFirstName || ''} ${data.AccountLastName || ''}`.trim();

            // Convert access codes array to legacy fields
            if (data.subscriptionPlans?.[0]?.accessCodes && data.subscriptionPlans[0].accessCodes.length > 0) {
                data.subscriptionPlans[0].accessCodes.forEach((accessCode, index) => {
                    if (index < 3) {
                        legacyData[`SubscriptionAccessCode${index + 1}`] = accessCode.code;
                        legacyData[`SubscriptionAccessCodeType${index + 1}`] = accessCode.type;
                    }
                });
            }

            // Convert assigned units array to legacy fields
            if (data.subscriptionPlans?.[0]?.assignedUnits && data.subscriptionPlans[0].assignedUnits.length > 0) {
                data.subscriptionPlans[0].assignedUnits.forEach((unit, index) => {
                    if (index < 3) {
                        legacyData[`SubscriptionMemberAssignedUnit${index + 1}`] = unit.unit;
                    }
                });
            }

            // Convert vehicles array to legacy fields
            if (data.subscriptionPlans?.[0]?.vehicles && data.subscriptionPlans[0].vehicles.length > 0) {
                data.subscriptionPlans[0].vehicles.forEach((vehicle, index) => {
                    if (index < 3) {
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
        });
    };

    // Helper function to generate Excel file
    const exportAllAccountsToExcel = () => {
        try {
            // Convert to legacy format
            const legacyData = convertAllAccountsToLegacyRows(accounts);

            // Create a new workbook
            const workbook = XLSX.utils.book_new();

            // Define the column order based on all possible legacy fields
                    const columnOrder = [
            'RunId', 'AccountId', 'AccountName', 'AccountFirstName', 'AccountLastName', 'AccountEmail',
            'AccountPhone', 'AccountAddress1', 'AccountAddress2', 'AccountCity', 'AccountState', 'AccountPostalCode',
            'AccountCountry', 'AccountType', 'AccountBillToName', 'AccountBillToFirstName', 'AccountBillToLastName',
            'AccountBillToEmail', 'AccountBillToPhone', 'AccountBillToAddress1', 'AccountBillToAddress2',
            'AccountBillToCity', 'AccountBillToState', 'AccountBillToPostalCode', 'AccountBillToCountry',
            'SubscriptionId', 'SubscriptionName', 'SubscriptionType', 'SubscriptionEffectiveDate',
            'SubscriptionInvoiceTemplate', 'SubscriptionDefaultLanguage', 'SubscriptionTaxNumber1', 'SubscriptionTaxNumber2',
            'SubscriptionMemberId', 'SubscriptionMemberFirstName', 'SubscriptionMemberLastName', 'SubscriptionMemberEmail',
            'SubscriptionMemberPhone', 'SubscriptionMemberRateplanName', 'SubscriptionAccessMemberCode1',
            'SubscriptionAccessMemberCodeType1', 'SubscriptionAccessMemberCode2', 'SubscriptionAccessMemberCodeType2',
            'SubscriptionAccessMemberCode3', 'SubscriptionAccessMemberCodeType3', 'SubscriptionMemberAssignedUnit1',
            'SubscriptionMemberAssignedUnit2', 'SubscriptionMemberAssignedUnit3', 'SubscriptionMemberVehicle1Name',
            'SubscriptionMemberVehicle1PlateNumber', 'SubscriptionMemberVehicle1State', 'SubscriptionMemberVehicle1Color',
            'SubscriptionMemberVehicle1Make', 'SubscriptionMemberVehicle1Model', 'SubscriptionMemberVehicle2Name',
            'SubscriptionMemberVehicle2PlateNumber', 'SubscriptionMemberVehicle2State', 'SubscriptionMemberVehicle2Color',
            'SubscriptionMemberVehicle2Make', 'SubscriptionMemberVehicle2Model', 'SubscriptionMemberVehicle3Name',
            'SubscriptionMemberVehicle3PlateNumber', 'SubscriptionMemberVehicle3State', 'SubscriptionMemberVehicle3Color',
            'SubscriptionMemberVehicle3Make', 'SubscriptionMemberVehicle3Model'
        ];

        // Ensure all rows have all columns
        const legacyRows = convertAllAccountsToLegacyRows(accounts);
        const orderedRows = legacyRows.map(row => {
            const ordered: any = {};
            columnOrder.forEach(col => {
                ordered[col] = row[col] || '';
            });
            return ordered;
        });
        // Convert to worksheet
        const worksheet = XLSX.utils.json_to_sheet(orderedRows);

            // Add the worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscription Data');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const filename = `subscription_${legacyData[0]?.AccountLastName || 'export'}_${timestamp}.xlsx`;

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
    currentAccount.RunId = 10;
    if (validateAllAccounts() && validateForm()) {
        try {

            // Export all accounts at once
            const filename = exportAllAccountsToExcel();
            alert(`Successfully exported ${accounts.length} account(s) to ${filename}!`);
            changeAccountId();
            window.location.reload();
        } catch (error) {
            console.error('Error during form submission:', error);
            alert('Form submitted successfully, but there was an error generating the Excel file. Please try again.');
        }
    } else {
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
            const updatedAccount = {
                ...currentAccount,
                AccountBillToName: `${currentAccount.AccountFirstName || ''} ${currentAccount.AccountLastName || ''}`.trim(),
                AccountBillToFirstName: currentAccount.AccountFirstName || '',
                AccountBillToLastName: currentAccount.AccountLastName || '',
                AccountBillToEmail: currentAccount.AccountEmail || '',
                AccountBillToPhone: currentAccount.AccountPhone || '',
                AccountBillToAddress1: currentAccount.AccountAddress1 || '',
                AccountBillToAddress2: currentAccount.AccountAddress2 || '',
                AccountBillToCity: currentAccount.AccountCity || '',
                AccountBillToState: currentAccount.AccountState || '',
                AccountBillToPostalCode: currentAccount.AccountPostalCode || '',
                AccountBillToCountry: currentAccount.AccountCountry || ''
            };
            
            setAccounts(prev => prev.map((account, idx) => 
                idx === activeAccountIndex ? updatedAccount : account
            ));
            
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
                    SubscriptionMembers: [
                        {
                            SubscriptionMemberId: 1,
                            SubscriptionMemberFirstName: 'Jane',
                            SubscriptionMemberLastName: 'Smith',
                            SubscriptionMemberEmail: 'jane.smith@example.com',
                            SubscriptionMemberPhone: '(555)555-0123',
                            SubscriptionMemberRateplanName: 'Standard Monthly Plan'
                        }
                    ],
                    accessCodes: [
                        {
                            id: '1',
                            code: 'ABC123',
                            type: 'PROXCARD'
                        }
                    ],
                    assignedUnits: [
                        {
                            unit: 'A101'
                        }
                    ],
                    vehicles: [
                        {
                            id: 'v1',
                            name: 'Primary Car',
                            plateNumber: 'ABC123',
                            make: 'Toyota',
                            model: 'Camry',
                            color: 'Blue',
                            state: 'NY'
                        }
                    ]

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
        
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex ? testData : account
        ));
        
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

                // Validate required columns
                const requiredCols = ['firstname','lastname','email','phone','address 1','city','state','country','zipcode','use account address as billing address? (y/n)'];
                for (const col of requiredCols) {
                    if (!header.includes(col)) throw new Error(`Missing required column: ${col}`);
                }

                // Map each data row to an account object
                const newAccounts: Partial<SubscriptionData>[] = rows.slice(1).map((row: any[]) => {
                    const get = (col: string) => {
                        const idx = header.indexOf(col.toLowerCase());
                        return idx !== -1 ? row[idx] : '';
                    };
                    const useBilling = (get('use account address as billing address? (y/n)') || '').toString().toUpperCase().startsWith('Y');
                    return {
                        RunId: 10,
                        AccountId: getAccountId(),
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
                        AccountType: '', // or set from template if present

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
                        subscriptionPlans: [
                            {
                                SubscriptionId: 1,
                                SubscriptionName: '',
                                SubscriptionType: 'EVERGREEN',
                                SubscriptionEffectiveDate: new Date(),
                                SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                                SubscriptionMembers: [],
                                accessCodes: [],
                                assignedUnits: [],
                                vehicles: []
                            }
                        ]
                    };
                    
                });

                // Add new accounts to state
                setAccounts(prev => [...prev, ...newAccounts]);
                setActiveAccountIndex(accounts.length); // Optionally switch to the first new account
                setImportSuccess('Account data imported successfully!');
                window.scrollTo({ top: 200, behavior: 'smooth' });
            } catch (err: any) {
                setImportError(err.message || 'Failed to import account data.');
            }
            e.target.value = '';
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
    const billingStateOptions = currentAccount.AccountBillToCountry === 'US'
        ? states
        : currentAccount.AccountBillToCountry === 'CA'
            ? provinces
            : [...states, ...provinces];
    */ }
    const addMember = () => {
        // Add member to the first subscription plan (if exists)
        if ((currentAccount.subscriptionPlans && currentAccount.subscriptionPlans[0]?.SubscriptionMembers || []).length >= 3) return;
        const newMember = {
            SubscriptionMemberId: 1,
            SubscriptionMemberFirstName: '',
            SubscriptionMemberLastName: '',
            SubscriptionMemberEmail: '',
            SubscriptionMemberPhone: '',
            SubscriptionMemberRateplanName: ''
        };
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((plan, planIdx) =>
                        planIdx === 0
                            ? {
                                ...plan,
                                SubscriptionMembers: [
                                    ...(plan.SubscriptionMembers || []),
                                    newMember
                                ]
                            }
                            : plan
                    )
                }
                : account
        ));
    };

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
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600 }}>
                                Accounts ({accounts.length})
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={addNewAccount}
                                sx={{ backgroundColor: '#007dba' }}
                            >
                                Add New Account
                            </Button>
                        </Box>
                        
                        {/* Account Tabs */}
                        <Box sx={{ mt: 2 }}>
                            {accounts.map((account, index) => (
                                <Chip
                                    label={`Account ${index + 1}: ${account.AccountFirstName || ''} ${account.AccountLastName || ''}`}
                                    key={index}
                                    variant={activeAccountIndex === index ? "filled" : "outlined"}
                                    onClick={() => setActiveAccountIndex(index)}
                                    onDelete={() => deleteAccount(index)}
                                    color={activeAccountIndex === index ? "primary" : "default"}
                                    sx={{ mr: 1, mb: 1 }}
                                    size="medium"
                                />

                            ))}
                        </Box>
                    </Paper>

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
                                    value={currentAccount.AccountFirstName || ''}
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
                                    value={currentAccount.AccountLastName || ''}
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
                                    value={currentAccount.AccountEmail || ''}
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
                                    value={currentAccount.AccountPhone || ''}
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
                                    value={currentAccount.AccountAddress1 || ''}
                                    onChange={(e) => handleInputChange('AccountAddress1', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="Address Line 2"
                                    value={currentAccount.AccountAddress2 || ''}
                                    onChange={(e) => handleInputChange('AccountAddress2', e.target.value)}
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <Autocomplete
                                    fullWidth
                                    options={
                                        currentAccount.AccountCountry === 'US'
                                            ? states
                                            : currentAccount.AccountCountry === 'CA'
                                                ? provinces
                                                : [...states, ...provinces]
                                    }
                                    value={currentAccount.AccountState || ''}
                                    onChange={(_, newValue) => {
                                        handleInputChange('AccountState', newValue || '');
                                    }}
                                    renderInput={(params) => {
                                        let stateLabel = "State/Province";
                                        if (currentAccount.AccountCountry === 'US') stateLabel = "State";
                                        else if (currentAccount.AccountCountry === 'CA') stateLabel = "Province";
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
                                    value={currentAccount.AccountCity || ''}
                                    onChange={(e) => handleInputChange('AccountCity', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 150 }}>
                                <TextField
                                    fullWidth
                                    label="Postal Code"
                                    value={currentAccount.AccountPostalCode || ''}
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
                                        value={currentAccount.AccountCountry || ''}
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
                                        value={currentAccount.AccountType || ''}
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
                                            checked={copyAccountToBilling || !!currentAccount.AccountBillToName && currentAccount.AccountBillToName === `${currentAccount.AccountFirstName || ''} ${currentAccount.AccountLastName || ''}`.trim()}
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
                                    value={currentAccount.AccountBillToName || ''}
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
                                    value={currentAccount.AccountBillToFirstName || ''}
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
                                    value={currentAccount.AccountBillToLastName || ''}
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
                                    value={currentAccount.AccountBillToEmail || ''}
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
                                    value={currentAccount.AccountBillToPhone || ''}
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
                                    value={currentAccount.AccountBillToAddress1 || ''}
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
                                    value={currentAccount.AccountBillToAddress2 || ''}
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
                                    value={currentAccount.AccountBillToState || ''}
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
                                    value={currentAccount.AccountBillToCity || ''}
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
                                    value={currentAccount.AccountBillToPostalCode || ''}
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
                                        value={currentAccount.AccountBillToCountry || ''}
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
                                    setAccounts(prev => prev.map((account, idx) => {
                                        if (idx !== activeAccountIndex) return account;
                                        const nextId = ((account.subscriptionPlans?.length || 0) + 1);
                                        const newPlan: SubscriptionPlan = {
                                            SubscriptionId: nextId,
                                            SubscriptionName: '',
                                            SubscriptionType: 'EVERGREEN',
                                            SubscriptionEffectiveDate: firstOfMonth,
                                            SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                                            SubscriptionMembers: [{
                                                    SubscriptionMemberId: 1,
                                                    SubscriptionMemberFirstName: currentAccount.AccountFirstName || '',
                                                    SubscriptionMemberLastName: currentAccount.AccountLastName || '',
                                                    SubscriptionMemberEmail: currentAccount.AccountEmail || '',
                                                    SubscriptionMemberPhone: currentAccount.AccountPhone || '',
                                                    SubscriptionMemberRateplanName: ''
                                            }],
                                            accessCodes: [],
                                            assignedUnits: [],
                                            vehicles: []
                                        }
                                        return {
                                            ...account,
                                            subscriptionPlans: [
                                                ...(account.subscriptionPlans || []),
                                                newPlan
                                            ]
                                        };
                                    }));
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
                                    {(currentAccount.subscriptionPlans || []).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography variant="body2" color="text.secondary">
                                                    No subscription plans added yet. Click "Add Subscription" to get started.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {(currentAccount.subscriptionPlans || []).map((plan: any) => (
                                        <TableRow key={plan.id}>
                                            <TableCell align="center">
                                                <IconButton
                                                    onClick={() => {
                                                        setAccounts(prev => prev.map((account, idx) => 
                                                            idx === activeAccountIndex
                                                                ? {
                                                                    ...account,
                                                                    subscriptionPlans: (account.subscriptionPlans || []).filter((p: any) => p.id !== plan.id)
                                                                }
                                                                : account
                                                        ));
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
                                                        setAccounts(prev => prev.map((account, idx) => 
                                                            idx === activeAccountIndex
                                                                ? {
                                                                    ...account,
                                                                    subscriptionPlans: (account.subscriptionPlans || []).map((p: any) =>
                                                                        p.id === plan.id ? { ...p, SubscriptionId: value } : p
                                                                    )
                                                                }
                                                                : account
                                                        ));
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
                                                        setAccounts(prev => prev.map((account, idx) => 
                                                            idx === activeAccountIndex
                                                                ? {
                                                                    ...account,
                                                                    subscriptionPlans: (account.subscriptionPlans || []).map((p: any) =>
                                                                        p.id === plan.id ? { ...p, SubscriptionName: value } : p
                                                                    )
                                                                }
                                                                : account
                                                        ));
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
                                                            setAccounts(prev => prev.map((account, idx) => 
                                                                idx === activeAccountIndex
                                                                    ? {
                                                                        ...account,
                                                                        subscriptionPlans: (account.subscriptionPlans || []).map((p: any) =>
                                                                            p.id === plan.id ? { ...p, SubscriptionType: value } : p
                                                                        )
                                                                    }
                                                                    : account
                                                            ));
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
                                                        setAccounts(prev => prev.map((account, idx) => 
                                                            idx === activeAccountIndex
                                                                ? {
                                                                    ...account,
                                                                    subscriptionPlans: (account.subscriptionPlans || []).map((p: any) =>
                                                                        p.id === plan.id ? { ...p, SubscriptionEffectiveDate: value } : p
                                                                    )
                                                                }
                                                                : account
                                                        ));
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
                                                            setAccounts(prev => prev.map((account, idx) => 
                                                                idx === activeAccountIndex
                                                                    ? {
                                                                        ...account,
                                                                        subscriptionPlans: (account.subscriptionPlans || []).map((p: any) =>
                                                                            p.id === plan.id ? { ...p, SubscriptionInvoiceTemplate: value } : p
                                                                        )
                                                                    }
                                                                    : account
                                                            ));
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
                         <Box sx={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" sx={{ color: '#007dba' }}>
                                    Member Information
                                </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={addMember}
                                sx={{
                                    backgroundColor: '#007dba',
                                    '&:hover': { backgroundColor: '#005a94' },
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    px: 2,
                                    py: 1,
                                    mt: 2
                                }}
                            >
                                Add Member
                            </Button>
                            </Box>
                            {(currentAccount.subscriptionPlans && currentAccount.subscriptionPlans[0]?.SubscriptionMembers?.length > 0) && (
                                <TableContainer component={Paper} sx={{ mb: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                                <TableCell width="30px" align="center"></TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Member ID</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>First Name</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Last Name</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Phone</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Rate Plan Name</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(currentAccount.subscriptionPlans[0]?.SubscriptionMembers || []).map((member, idx) => (
                                                <TableRow key={member.SubscriptionMemberId || idx}>
                                                    <TableCell align="center">
                                                        <TableCell align="center">
                                                                <IconButton
                                                                    onClick={() => removeMember(String(member.SubscriptionMemberId))}
                                                                    size="small"
                                                                    sx={{ color: '#B20838' }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            value={member.SubscriptionMemberId || ''}
                                                            disabled
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={member.SubscriptionMemberFirstName || ''}
                                                            onChange={e => {
                                                                const value = e.target.value;
                                                                setAccounts(prev => prev.map((account, accountIdx) => 
                                                                    accountIdx === activeAccountIndex
                                                                        ? {
                                                                            ...account,
                                                                            subscriptionPlans: (account.subscriptionPlans || []).map((plan, planIdx) =>
                                                                                planIdx === 0
                                                                                    ? {
                                                                                        ...plan,
                                                                                        SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                                                                                            mIdx === idx
                                                                                                ? { ...m, SubscriptionMemberFirstName: value }
                                                                                                : m
                                                                                        )
                                                                                    }
                                                                                    : plan
                                                                            )
                                                                        }
                                                                        : account
                                                                ));
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={member.SubscriptionMemberLastName || ''}
                                                            onChange={e => {
                                                                const value = e.target.value;
                                                                setAccounts(prev => prev.map((account, accountIdx) => 
                                                                    accountIdx === activeAccountIndex
                                                                        ? {
                                                                            ...account,
                                                                            subscriptionPlans: (account.subscriptionPlans || []).map((plan, planIdx) =>
                                                                                planIdx === 0
                                                                                    ? {
                                                                                        ...plan,
                                                                                        SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                                                                                            mIdx === idx
                                                                                                ? { ...m, SubscriptionMemberLastName: value }
                                                                                                : m
                                                                                        )
                                                                                    }
                                                                                    : plan
                                                                            )
                                                                        }
                                                                        : account
                                                                ));
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={member.SubscriptionMemberEmail || ''}
                                                            onChange={e => {
                                                                const value = e.target.value;
                                                                setAccounts(prev => prev.map((account, accountIdx) => 
                                                                    accountIdx === activeAccountIndex
                                                                        ? {
                                                                            ...account,
                                                                            subscriptionPlans: (account.subscriptionPlans || []).map((plan, planIdx) =>
                                                                                planIdx === 0
                                                                                    ? {
                                                                                        ...plan,
                                                                                        SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                                                                                            mIdx === idx
                                                                                                ? { ...m, SubscriptionMemberEmail: value }
                                                                                                : m
                                                                                        )
                                                                                    }
                                                                                    : plan
                                                                            )
                                                                        }
                                                                        : account
                                                                ));
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={member.SubscriptionMemberPhone || ''}
                                                            onChange={e => {
                                                                const value = e.target.value;
                                                                setAccounts(prev => prev.map((account, accountIdx) => 
                                                                    accountIdx === activeAccountIndex
                                                                        ? {
                                                                            ...account,
                                                                            subscriptionPlans: (account.subscriptionPlans || []).map((plan, planIdx) =>
                                                                                planIdx === 0
                                                                                    ? {
                                                                                        ...plan,
                                                                                        SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                                                                                            mIdx === idx
                                                                                                ? { ...m, SubscriptionMemberPhone: value }
                                                                                                : m
                                                                                        )
                                                                                    }
                                                                                    : plan
                                                                            )
                                                                        }
                                                                        : account
                                                                ));
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={member.SubscriptionMemberRateplanName || ''}
                                                            onChange={e => {
                                                                const value = e.target.value;
                                                                setAccounts(prev => prev.map((account, accountIdx) => 
                                                                    accountIdx === activeAccountIndex
                                                                        ? {
                                                                            ...account,
                                                                            subscriptionPlans: (account.subscriptionPlans || []).map((plan, planIdx) =>
                                                                                planIdx === 0
                                                                                    ? {
                                                                                        ...plan,
                                                                                        SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                                                                                            mIdx === idx
                                                                                                ? { ...m, SubscriptionMemberRateplanName: value }
                                                                                                : m
                                                                                        )
                                                                                    }
                                                                                    : plan
                                                                            )
                                                                        }
                                                                        : account
                                                                ));
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
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
                                                py: 1,
                                                mt: 2
                                            }}
                                            disabled={(accessCodes || []).length >= 3}
                                        >
                                            Add Code
                                        </Button>
                                    </Box>
                                    {(accessCodes || []).length > 0 && (
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
                                                    {(accessCodes || []).map((accessCode) => (
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
                                    {(accessCodes || []).length === 0 && (
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
                                                py: 1,
                                                mt: 2
                                            }}
                                            disabled={(assignedUnits || []).length >= 1}
                                        >
                                            Add Unit
                                        </Button>
                                    </Box>
                                    {(assignedUnits || []).length > 0 && (
                                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                                        <TableCell width="30px" align="center"></TableCell>
                                                        <TableCell sx={{ fontWeight: 600, color: '#007dba', fontSize: '0.8rem' }}>Unit</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {(assignedUnits || []).map((unit) => (
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
                                    {(assignedUnits || []).length === 0 && (
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
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box sx={{ flexBasis: { xs: '100%', md: 'auto' }, minWidth: 200, flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6" sx={{ color: '#007dba' }}>
                                        Vehicles Registration
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
                                            fontWeight: 600,
                                            mt: 2
                                        }}
                                        disabled={(vehicles || []).length >= 3}
                                    >
                                        Add New Vehicle
                                    </Button>
                                </Box>
                                {(vehicles || []).length > 0 && (
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
                                                {(vehicles || []).map((vehicle) => (
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

                                {(vehicles || []).length === 0 && (
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

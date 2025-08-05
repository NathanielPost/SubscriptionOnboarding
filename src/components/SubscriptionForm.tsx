import React, { useState, useEffect } from 'react';
import { SubscriptionData, AccessCode, AssignedUnit, Vehicle, memberInfo } from '../types/subscription';
import * as XLSX from 'xlsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert, SelectChangeEvent,
  Autocomplete, Tooltip, Checkbox, FormControlLabel, Chip, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SubscriptionPlan } from '../types/subscription'; // Adjust the path as needed
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


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

const SubscriptionForm: React.FC = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveAccountIds([getActiveAccountIds()[0]]);
    }, []);

    // Submitted Account IDs (permanent - never reset except manually)
    const getSubmittedAccountIds = (): number[] => {
        const key = 'submittedAccountIds';
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    };

    const addToSubmittedAccountIds = (accountIds: number[]) => {
        const key = 'submittedAccountIds';
        const existing = getSubmittedAccountIds();
        const combined = [...new Set([...existing, ...accountIds])]; // Remove duplicates
        localStorage.setItem(key, JSON.stringify(combined));
    };

    // Active Account IDs (temporary - reset when accounts deleted)
    const getActiveAccountIds = (): number[] => {
        const key = 'activeAccountIds';
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    };

    const setActiveAccountIds = (accountIds: number[]) => {
        const key = 'activeAccountIds';
        localStorage.setItem(key, JSON.stringify(accountIds));
    };

    const getNextAccountId = (): number => {
        const submittedIds = getSubmittedAccountIds();
        const activeIds = getActiveAccountIds();
        const allIds = [...new Set([...submittedIds, ...activeIds])];
        return allIds.length + 1;
    };

    const addActiveAccountId = (accountId: number) => {
        const activeIds = getActiveAccountIds();
        if (!activeIds.includes(accountId)) {
            activeIds.push(accountId);
            setActiveAccountIds(activeIds);
        }
    };

    // Submitted Subscription IDs (permanent - never reset except manually)
    const getSubmittedSubscriptionIds = (): number[] => {
        const key = 'submittedSubscriptionIds';
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    };

    const addToSubmittedSubscriptionIds = (subscriptionIds: number[]) => {
        const key = 'submittedSubscriptionIds';
        const existing = getSubmittedSubscriptionIds();
        const combined = [...new Set([...existing, ...subscriptionIds])]; // Remove duplicates
        localStorage.setItem(key, JSON.stringify(combined));
    };

    // Active Subscription IDs (temporary - reset when accounts deleted)
    const getActiveSubscriptionIds = (): number[] => {
        const key = 'activeSubscriptionIds';
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    };

    const setActiveSubscriptionIds = (subscriptionIds: number[]) => {
        const key = 'activeSubscriptionIds';
        localStorage.setItem(key, JSON.stringify(subscriptionIds));
    };

    const getNextSubscriptionId = (): number => {
        const submittedIds = getSubmittedSubscriptionIds();
        const activeIds = getActiveSubscriptionIds();
        const allIds = [...new Set([...submittedIds, ...activeIds])];
        return allIds.length + 1;
    };

    const addActiveSubscriptionId = (subscriptionId: number) => {
        const activeIds = getActiveSubscriptionIds();
        if (!activeIds.includes(subscriptionId)) {
            activeIds.push(subscriptionId);
            setActiveSubscriptionIds(activeIds);
        }
    };

    const resetAccountIdCounter = () => {
        const resetConfirm = window.confirm("Are you sure you want to reset the Account ID counter? ");
        if (!resetConfirm) {
            alert("Account ID counter reset cancelled.");
            return;
        } else {
        // Reset both account and subscription IDs
            const submittedAccountKey = 'submittedAccountIds';
            const activeAccountKey = 'activeAccountIds';
            const submittedSubscriptionKey = 'submittedSubscriptionIds';
            const activeSubscriptionKey = 'activeSubscriptionIds';
            
            localStorage.setItem(submittedAccountKey, JSON.stringify([]));
            localStorage.setItem(activeAccountKey, JSON.stringify([]));
            localStorage.setItem(submittedSubscriptionKey, JSON.stringify([]));
            localStorage.setItem(activeSubscriptionKey, JSON.stringify([]));
            
            // Reset the form and assign new IDs
            const newAccountId = getNextAccountId();
            const newSubscriptionId = getNextSubscriptionId();
            
            setAccounts([{
                RunId: 10,
                AccountId: newAccountId,
                subscriptionPlans: [{
                    SubscriptionId: newSubscriptionId,
                    SubscriptionName: '',
                    SubscriptionType: 'EVERGREEN',
                    SubscriptionEffectiveDate: new Date(),
                    SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                    SubscriptionMembers: []
                }]
            }]);
            
            addActiveAccountId(newAccountId);
            addActiveSubscriptionId(newSubscriptionId);
            setActiveAccountIndex(0);
            setErrors({});
            setCopyAccountToBilling(false);
            setImportError(null);
            setImportSuccess(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Update the initial accounts state to include subscription ID tracking (around line 140)
    const [accounts, setAccounts] = useState<Partial<SubscriptionData>[]>(() => {
        // Reset active IDs first
        const activeAccountKey = 'activeAccountIds';
        const activeSubscriptionKey = 'activeSubscriptionIds';
        localStorage.setItem(activeAccountKey, JSON.stringify([]));
        localStorage.setItem(activeSubscriptionKey, JSON.stringify([]));
        
        // Calculate the initial IDs
        const submittedAccountIds = getSubmittedAccountIds();
        const submittedSubscriptionIds = getSubmittedSubscriptionIds();
        const initialAccountId = submittedAccountIds.length + 1;
        const initialSubscriptionId = submittedSubscriptionIds.length + 1;
        
        // Add to active IDs immediately
        setActiveAccountIds([initialAccountId]);
        setActiveSubscriptionIds([initialSubscriptionId]);
        
        return [{
            RunId: 10,
            AccountId: initialAccountId,
            subscriptionPlans: [{
                SubscriptionId: initialSubscriptionId,
                SubscriptionName: '',
                SubscriptionType: 'EVERGREEN',
                SubscriptionEffectiveDate: new Date(),
                SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                SubscriptionMembers: []
            }]
        }];
    });

    const [activeAccountIndex, setActiveAccountIndex] = useState(0);
    const currentAccount = accounts[activeAccountIndex] || {};
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [copyAccountToBilling, setCopyAccountToBilling] = useState(false);

    const deleteAccount = (index: number) => {
        if (accounts.length > 1) {

            // Remove the account from the array
            const remainingAccounts = accounts.filter((_, i) => i !== index);
            
            // Reset active IDs and reassign sequentially
            const submittedAccountCount = getSubmittedAccountIds().length;
            const submittedSubscriptionCount = getSubmittedSubscriptionIds().length;
            const startingAccountId = submittedAccountCount + 1;
            const startingSubscriptionId = submittedSubscriptionCount + 1;
            
            let currentSubscriptionId = startingSubscriptionId;
            
            // Reassign Account IDs and Subscription IDs sequentially
            const updatedAccounts = remainingAccounts.map((account, newIndex) => {
                const newAccountId = startingAccountId + newIndex;
                const updatedPlans = (account.subscriptionPlans || []).map(plan => ({
                    ...plan,
                    SubscriptionId: currentSubscriptionId++
                }));
                
                return {
                    ...account,
                    AccountId: newAccountId,
                    subscriptionPlans: updatedPlans
                };
            });
            
            // Update active ID lists
            const newActiveAccountIds = updatedAccounts.map(account => account.AccountId);
            const newActiveSubscriptionIds = updatedAccounts.flatMap(account => 
                (account.subscriptionPlans || []).map(plan => plan.SubscriptionId)
            );
            
            setActiveAccountIds(newActiveAccountIds);
            setActiveSubscriptionIds(newActiveSubscriptionIds);
            
            setAccounts(updatedAccounts);
            
            // Adjust active account index
            if (activeAccountIndex >= updatedAccounts.length) {
                setActiveAccountIndex(Math.max(0, updatedAccounts.length - 1));
            } else if (activeAccountIndex > index) {
                setActiveAccountIndex(activeAccountIndex - 1);
            }
        }
    };

    const addNewAccount = () => {
        const newAccountId = getNextAccountId();
        const newSubscriptionId = getNextSubscriptionId();
        
        const newAccount: Partial<SubscriptionData> = {
            RunId: 10,
            AccountId: newAccountId,
            subscriptionPlans: [{
                SubscriptionId: newSubscriptionId,
                SubscriptionName: '',
                SubscriptionType: 'EVERGREEN',
                SubscriptionEffectiveDate: new Date(),
                SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                SubscriptionMembers: []
            }]
        };
        
        addActiveAccountId(newAccountId);
        addActiveSubscriptionId(newSubscriptionId);
        setAccounts(prev => [...prev, newAccount]);
        setActiveAccountIndex(accounts.length);
    };

    const removeMember = (id: string) => {
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((plan) => ({
                        ...plan,
                        SubscriptionMembers: (plan.SubscriptionMembers || []).filter(member => String(member.SubscriptionMemberId) !== id)
                    }))
                }
                : account
        ));
    };
    const removePlan = (id: number) => {
        setAccounts(prev => prev.map((account, idx) => {
            if (idx !== activeAccountIndex) return account;
            
            // Remove the plan with the specified ID
            const remainingPlans = (account.subscriptionPlans || []).filter((p: any) => p.SubscriptionId !== id);
            
            // Get the current submitted subscription count to determine starting ID
            const submittedSubscriptionCount = getSubmittedSubscriptionIds().length;
            const startingSubscriptionId = submittedSubscriptionCount + 1;
            
            // Reassign subscription IDs sequentially starting from the next available ID
            const updatedPlans = remainingPlans.map((plan, index) => ({
                ...plan,
                SubscriptionId: startingSubscriptionId + index,
                // Also update the SubscriptionId for all members in this plan
                SubscriptionMembers: (plan.SubscriptionMembers || []).map(member => ({
                    ...member,
                    SubscriptionId: startingSubscriptionId + index
                }))
            }));
            
            // Update the active subscription IDs list
            const newActiveSubscriptionIds = updatedPlans.map(plan => plan.SubscriptionId);
            setActiveSubscriptionIds(newActiveSubscriptionIds);
            
            return {
                ...account,
                subscriptionPlans: updatedPlans
            };
        }));
    };

    // --- TOP OF FORM: Data Template Download & Import UI ---
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    const [isParkerImporting, setIsParkerImporting] = useState(false);
    const [isAccountImporting, setIsAccountImporting] = useState(false);
    const [memberPlanWarning, setMemberPlanWarning] = useState<string | null>(null);
    const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

    const accessCodeLabel = "Access Codes (Credentials)";
    const assignedUnitLabel = "Assigned Units (Space Number)";
    const addAccessCode = (planId: number, memberId: number, code: AccessCode) => {
    
        setAccounts(prev => prev.map((account, idx) =>
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: account.subscriptionPlans.map(plan =>
                        plan.SubscriptionId === planId
                        ? {
                            ...plan,
                            SubscriptionMembers: plan.SubscriptionMembers.map(member =>
                                member.SubscriptionMemberId === memberId
                                ? { ...member, accessCodes: [...member.accessCodes, code] }
                                : member
                            )
                        }
                    : plan
                )
            }
        : account
    ));
    };

    const removeAccessCode = (id: string) => {
        setAccounts(prev =>
            prev.map((account, idx) =>
                idx === activeAccountIndex
                    ? {
                        ...account,
                        subscriptionPlans: (account.subscriptionPlans || []).map(plan => ({
                            ...plan,
                            SubscriptionMembers: (plan.SubscriptionMembers || []).map(member => ({
                                ...member,
                                accessCodes: (member.accessCodes || []).filter(item => item.id !== id)
                            }))
                        }))
                    }
                    : account
            )
        );
        // Clear any errors for this row
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.includes(`accessCode_${id}`)) {
                delete newErrors[key];
            }
        });
        setErrors(newErrors);
    };

    const updateAccessCode = (planId: number, memberId: number, codeId: string, field: keyof AccessCode, value: string) => {
        setAccounts(prev => prev.map((account, idx) =>
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: account.subscriptionPlans.map(plan =>
                        plan.SubscriptionId === planId
                            ? {
                                ...plan,
                                SubscriptionMembers: plan.SubscriptionMembers.map(member =>
                                    member.SubscriptionMemberId === memberId
                                        ? {
                                            ...member,
                                            accessCodes: (member.accessCodes || []).map(code =>
                                                code.id === codeId ? { ...code, [field]: value } : code
                                            )
                                        }
                                        : member
                                )
                            }
                            : plan
                    )
                }
                : account
        ));
    };

    const addAssignedUnit = (planId: number, memberId: number, code: AssignedUnit) => {
        setAccounts(prev => prev.map((account, idx) =>
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: account.subscriptionPlans.map(plan =>
                        plan.SubscriptionId === planId
                        ? {
                            ...plan,
                            SubscriptionMembers: plan.SubscriptionMembers.map(member =>
                                member.SubscriptionMemberId === memberId
                                ? { ...member, assignedUnits: [...member.assignedUnits, code] }
                                : member
                            )
                        }
                    : plan
                )
            }
        : account
    ));
    };

    const removeAssignedUnit = (id: string) => {
        setAccounts(prev =>
            prev.map((account, idx) =>
                idx === activeAccountIndex
                    ? {
                        ...account,
                        subscriptionPlans: (account.subscriptionPlans || []).map(plan => ({
                            ...plan,
                            SubscriptionMembers: (plan.SubscriptionMembers || []).map(member => ({
                                ...member,
                                assignedUnits: (member.assignedUnits || []).filter(item => item.id !== id)
                            }))
                        }))
                    }
                    : account
            )
        );
        // Clear any errors for this row
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.includes(`assignedUnit_${id}`)) {
                delete newErrors[key];
            }
        });
        setErrors(newErrors);
    };

    const updateAssignedUnit = (planId: number, memberId: number, unitId: string, field: keyof AssignedUnit, value: string) => {
        setAccounts(prev => prev.map((account, idx) =>
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: account.subscriptionPlans.map(plan =>
                        plan.SubscriptionId === planId
                            ? {
                                ...plan,
                                SubscriptionMembers: plan.SubscriptionMembers.map(member =>
                                    member.SubscriptionMemberId === memberId
                                        ? {
                                            ...member,
                                            assignedUnits: (member.assignedUnits || []).map(unit =>
                                                unit.id === unitId ? { ...unit, [field]: value } : unit
                                            )
                                        }
                                        : member
                                )
                            }
                            : plan
                    )
                }
                : account
        ));
    };

    const addVehicle = (planId: number, memberId: number, code: Vehicle) => {
        setAccounts(prev => prev.map((account, idx) =>
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: account.subscriptionPlans.map(plan =>
                        plan.SubscriptionId === planId
                        ? {
                            ...plan,
                            SubscriptionMembers: plan.SubscriptionMembers.map(member =>
                                member.SubscriptionMemberId === memberId
                                ? { ...member, vehicles: [...member.vehicles, code] }
                                : member
                            )
                        }
                    : plan
                )
            }
        : account
    ));
    };

    const removeVehicle = (id: string) => {
        setAccounts(prev =>
            prev.map((account, idx) =>
                idx === activeAccountIndex
                    ? {
                        ...account,
                        subscriptionPlans: (account.subscriptionPlans || []).map(plan => ({
                            ...plan,
                            SubscriptionMembers: (plan.SubscriptionMembers || []).map(member => ({
                                ...member,
                                vehicles: (member.vehicles || []).filter(item => item.id !== id)
                            }))
                        }))
                    }
                    : account
            )
        );
        // Clear any errors for this row
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.includes(`vehicle_${id}`)) {
                delete newErrors[key];
            }
        });
        setErrors(newErrors);
    };

    const updateVehicle = (planId: number, memberId: number, vehicleId: string, field: keyof Vehicle, value: string) => {
        setAccounts(prev => prev.map((account, idx) =>
            idx === activeAccountIndex
                ? {
                    ...account,
                    subscriptionPlans: account.subscriptionPlans.map(plan =>
                        plan.SubscriptionId === planId
                            ? {
                                ...plan,
                                SubscriptionMembers: plan.SubscriptionMembers.map(member =>
                                    member.SubscriptionMemberId === memberId
                                        ? {
                                            ...member,
                                            vehicles: (member.vehicles || []).map(vehicle =>
                                                vehicle.id === vehicleId ? { ...vehicle, [field]: value } : vehicle
                                            )
                                        }
                                        : member
                                )
                            }
                            : plan
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
            Object.assign(newErrors, validateSubscriptionPlans(account.subscriptionPlans || []));
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
                if (value && value.trim() !== '') {
                    const usZipRegex = /^\d{5}(-\d{4})?$/; // US ZIP: 12345 or 12345-6789
                    const canPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/; // Canadian: A1A 1A1 or A1A-1A1
                    if (!usZipRegex.test(value) && !canPostalRegex.test(value)) {
                        return 'Must be valid postal code format (US: 12345 or 12345-6789, CA: A1A 1A1 or A1A-1A1)';
                    }
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

            default:
                return '';
        }
        return '';
    };

    const validateSubscriptionPlans = (subscriptionPlans: SubscriptionPlan[]) => {
        const errors: Record<string, string> = {};

        subscriptionPlans.forEach((plan, planIdx) => {
            // Plan-level required fields
            if (!plan.SubscriptionName || plan.SubscriptionName.trim() === '') {
                errors[`subscriptionPlans[${planIdx}].SubscriptionName`] = 'Subscription Name is required';
            }
            if (!plan.SubscriptionType || plan.SubscriptionType.trim() === '') {
                errors[`subscriptionPlans[${planIdx}].SubscriptionType`] = 'Subscription Type is required';
            }
            if (!plan.SubscriptionEffectiveDate) {
                errors[`subscriptionPlans[${planIdx}].SubscriptionEffectiveDate`] = 'Effective Date is required';
            }
            if (!plan.SubscriptionInvoiceTemplate || plan.SubscriptionInvoiceTemplate.trim() === '') {
                errors[`subscriptionPlans[${planIdx}].SubscriptionInvoiceTemplate`] = 'Invoice Template is required';
            }

            // Validate each member in the plan
            (plan.SubscriptionMembers || []).forEach((member, memberIdx) => {
                if (!member.SubscriptionMemberFirstName || member.SubscriptionMemberFirstName.trim() === '') {
                    errors[`subscriptionPlans[${planIdx}].SubscriptionMembers[${memberIdx}].SubscriptionMemberFirstName`] = 'First Name is required';
                }
                if (!member.SubscriptionMemberLastName || member.SubscriptionMemberLastName.trim() === '') {
                    errors[`subscriptionPlans[${planIdx}].SubscriptionMembers[${memberIdx}].SubscriptionMemberLastName`] = 'Last Name is required';
                }
                if (!member.SubscriptionMemberRateplanName || member.SubscriptionMemberRateplanName.trim() === '') {
                    errors[`subscriptionPlans[${planIdx}].SubscriptionMembers[${memberIdx}].SubscriptionMemberRateplanName`] = 'Rate Plan Name is required';
                }
                // Optionally validate email/phone if required
                // if (!member.SubscriptionMemberEmail || member.SubscriptionMemberEmail.trim() === '') {
                //     errors[`subscriptionPlans[${planIdx}].SubscriptionMembers[${memberIdx}].SubscriptionMemberEmail`] = 'Email is required';
                // }
            });
        });

        return errors;
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

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;

        // Required fields validation
        const requiredFields: (keyof SubscriptionData)[] = [
            'RunId', 'AccountId', 'AccountFirstName', 'AccountLastName', 'AccountEmail',
            'AccountState', 'AccountCountry', 'AccountType',
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
        const rows: any[] = [];
        accounts.forEach(account => {
            (account.subscriptionPlans || []).forEach(plan => {
                (plan.SubscriptionMembers || []).forEach(member => {
                    const row: { [key: string]: any } = {
                        // Account Info
                        RunId: 10,
                        AccountId: account.AccountId,
                    
                        AccountFirstName: account.AccountFirstName,
                        AccountLastName: account.AccountLastName,
                        AccountName: account.AccountFirstName + ' ' + account.AccountLastName,
                        AccountEmail: account.AccountEmail,
                        AccountPhone: account.AccountPhone,
                        AccountAddress1: account.AccountAddress1,
                        AccountAddress2: account.AccountAddress2,
                        AccountCity: account.AccountCity,
                        AccountState: account.AccountState,
                        AccountPostalCode: account.AccountPostalCode,
                        AccountCountry: account.AccountCountry,
                        AccountType: account.AccountType,
                        // Billing Info
                        AccountBillToName: account.AccountBillToFirstName + ' ' + account.AccountBillToLastName,
                        AccountBillToFirstName: account.AccountBillToFirstName,
                        AccountBillToLastName: account.AccountBillToLastName,
                        AccountBillToEmail: account.AccountBillToEmail,
                        AccountBillToPhone: account.AccountBillToPhone,
                        AccountBillToAddress1: account.AccountBillToAddress1,
                        AccountBillToAddress2: account.AccountBillToAddress2,
                        AccountBillToCity: account.AccountBillToCity,
                        AccountBillToState: account.AccountBillToState,
                        AccountBillToPostalCode: account.AccountBillToPostalCode,
                        AccountBillToCountry: account.AccountBillToCountry,
                        // Plan Info
                        SubscriptionId: plan.SubscriptionId,
                        SubscriptionName: plan.SubscriptionName,
                        SubscriptionType: plan.SubscriptionType,
                        SubscriptionEffectiveDate: plan.SubscriptionEffectiveDate,
                        SubscriptionInvoiceTemplate: plan.SubscriptionInvoiceTemplate,
                        // Member Info
                        SubscriptionMemberId: member.SubscriptionMemberId,
                        SubscriptionMemberFirstName: member.SubscriptionMemberFirstName,
                        SubscriptionMemberLastName: member.SubscriptionMemberLastName,
                        SubscriptionMemberEmail: member.SubscriptionMemberEmail,
                        SubscriptionMemberPhone: member.SubscriptionMemberPhone,
                        SubscriptionMemberRateplanName: member.SubscriptionMemberRateplanName,
                    };

                    // Access Codes (up to 3)
                    (member.accessCodes || []).slice(0, 3).forEach((code, i) => {
                        row[`SubscriptionMemberAccessCode${i + 1}`] = code.code;
                        row[`SubscriptionMemberAccessCodeType${i + 1}`] = code.type;
                    });

                    // Assigned Units (up to 3)
                    (member.assignedUnits || []).slice(0, 3).forEach((unit, i) => {
                        row[`SubscriptionMemberAssignedUnit${i + 1}`] = unit.unit;
                    });

                    // Vehicles (up to 3)
                    (member.vehicles || []).slice(0, 3).forEach((vehicle, i) => {
                        row[`SubscriptionMemberVehicle${i + 1}Name`] = vehicle.name;
                        row[`SubscriptionMemberVehicle${i + 1}PlateNumber`] = vehicle.plateNumber;
                        row[`SubscriptionMemberVehicle${i + 1}State`] = vehicle.state;
                        row[`SubscriptionMemberVehicle${i + 1}Color`] = vehicle.color;
                        row[`SubscriptionMemberVehicle${i + 1}Make`] = vehicle.make;
                        row[`SubscriptionMemberVehicle${i + 1}Model`] = vehicle.model;
                    });

                    rows.push(row);
                });
            });
        });
        return rows;
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
            'SubscriptionMemberPhone', 'SubscriptionMemberRateplanName', 'SubscriptionMemberAccessCode1',
            'SubscriptionMemberAccessCodeType1', 'SubscriptionMemberAccessCode2', 'SubscriptionMemberAccessCodeType2',
            'SubscriptionMemberAccessCode3', 'SubscriptionMemberAccessCodeType3', 'SubscriptionMemberAssignedUnit1',
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
        accounts.forEach(account => {
            account.RunId = 10;
            account.AccountId = account.AccountId;
        })
        console.log('Submitting form with current account:', currentAccount);
        if (validateAllAccounts() && validateForm()) {
            try {
                // Export all accounts at once
                const filename = exportAllAccountsToExcel();
                alert(`Successfully exported ${accounts.length} account(s) to ${filename}!`);
                
                // Add active IDs to submitted IDs
                const activeAccountIds = getActiveAccountIds();
                const activeSubscriptionIds = getActiveSubscriptionIds();
                addToSubmittedAccountIds(activeAccountIds);
                addToSubmittedSubscriptionIds(activeSubscriptionIds);
                
                // Clear active IDs since they're now submitted
                setActiveAccountIds([]);
                setActiveSubscriptionIds([]);
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
            AccountId: currentAccount.AccountId,
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
                            SubscriptionId: 1,
                            SubscriptionMemberId: 1,
                            SubscriptionMemberFirstName: 'Jane',
                            SubscriptionMemberLastName: 'Smith',
                            SubscriptionMemberEmail: 'jane.smith@example.com',
                            SubscriptionMemberPhone: '(555)555-0123',
                            SubscriptionMemberRateplanName: 'Standard Monthly Plan',
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
                    

                }
            ],
        };
        
        setAccounts(prev => prev.map((account, idx) => 
            idx === activeAccountIndex ? testData : account
        ));
        
        // Clear all errors when autofilling
        setErrors({});
        window.scrollTo({ top: 2098, behavior: 'smooth' });
    };

    const PARKER_TEMPLATE_HEADERS = [
        'first name', 'last name', 'email', 'phone', 'rate plan name', 'subscription plan id',
        'access code1', 'access code type1', 'access code2', 'access code type2', 'access code3', 'access code type3',
        'assigned unit1',
        'vehicle1name', 'vehicle1platenumber', 'vehicle1state', 'vehicle1color', 'vehicle1make', 'vehicle1model',
        'vehicle2name', 'vehicle2platenumber', 'vehicle2state', 'vehicle2color', 'vehicle2make', 'vehicle2model',
        'vehicle3name', 'vehicle3platenumber', 'vehicle3state', 'vehicle3color', 'vehicle3make', 'vehicle3model',
    ];

    // Download Data Template
    const handleParkerDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([PARKER_TEMPLATE_HEADERS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'parkerTemplate');
        XLSX.writeFile(wb, 'ParkerDataTemplate.xlsx');
    };

    const handleImportParkerData = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImportError(null);
        setImportSuccess(null);
        setIsParkerImporting(true);
        const file = e.target.files?.[0];
        if (!file) {
            setIsParkerImporting(false);
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            if (!data) {
                setIsParkerImporting(false);
                return;
            }
            try {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                if (rows.length < 2) throw new Error('No data found in file.');
                const header = (rows[0] as any[]).map((h: any) => (h || '').toString().trim().toLowerCase());
                console.log('Header:', header);
                
                // Validate required columns
                const requiredCols = [
                    'first name', 'last name', 'email', 'rate plan name', 'subscription plan id',
                    'vehicle1name', 'vehicle1platenumber', 'vehicle1state', 'vehicle1color', 'vehicle1make', 'vehicle1model',
                ];
                for (const col of requiredCols) {
                    if (!header.includes(col)) throw new Error(`Missing required column: ${col}`);
                }

                const validPlanIds = (currentAccount.subscriptionPlans || []).map(plan => String(plan.SubscriptionId));
                
                // Validate each row's Subscription Plan ID
                const invalidRows: { row: number; value: string }[] = [];
                rows.slice(1).forEach((row: any[], i: number) => {
                    const idx = header.indexOf('subscription plan id');
                    const planIdValue = idx !== -1 ? (row[idx] || '').toString().trim() : '';
                    if (!validPlanIds.includes(planIdValue)) {
                        invalidRows.push({ row: i + 2, value: planIdValue }); // +2 for Excel-like row number (header is row 1)
                    }
                });

                if (invalidRows.length > 0) {
                    setImportError(
                        `Import failed: The following rows have invalid Subscription Plan IDs:\n` +
                        invalidRows.map(r => `Row ${r.row}: "${r.value}"`).join('\n') +
                        `\nValid plan IDs are: ${validPlanIds.join(', ')}`
                    );
                    setIsParkerImporting(false);
                    return;
                } else {

                    // Map each data row to a member object
                    const newMembers: memberInfo[] = rows.slice(1).map((row: any[]) => {
                        const get = (col: string) => {
                            const idx = header.indexOf(col.toLowerCase());
                            return idx !== -1 ? (row[idx] || '').toString().trim() : '';
                        };
                        return {
                            SubscriptionId: Number(get('subscription plan id')), // Convert to number for proper matching
                            SubscriptionMemberId: 1, // Will be reassigned below
                            SubscriptionMemberFirstName: get('first name') || '',
                            SubscriptionMemberLastName: get('last name') || '',
                            SubscriptionMemberEmail: get('email') || '',
                            SubscriptionMemberPhone: get('phone') || '',
                            SubscriptionMemberRateplanName: get('rate plan name') || 'Default Plan',
                            accessCodes: [
                                { id: '1', code: get('access code1') || '', type: get('access code type1') || '' },
                                { id: '2', code: get('access code2') || '', type: get('access code type2') || '' },
                                { id: '3', code: get('access code3') || '', type: get('access code type3') || '' }
                            ].filter(code => code.code || code.type),
                            assignedUnits: [
                                { id: '1', unit: get('assigned unit1') || '' }
                            ].filter(unit => unit.unit),
                            vehicles: [
                                { id: '1', name: get('vehicle1name') || '', plateNumber: get('vehicle1platenumber') || '', state: get('vehicle1state') || '', color: get('vehicle1color') || '', make: get('vehicle1make') || '', model: get('vehicle1model') || '' },
                                { id: '2', name: get('vehicle2name') || '', plateNumber: get('vehicle2platenumber') || '', state: get('vehicle2state') || '', color: get('vehicle2color') || '', make: get('vehicle2make') || '', model: get('vehicle2model') || '' },
                                { id: '3', name: get('vehicle3name') || '', plateNumber: get('vehicle3platenumber') || '', state: get('vehicle3state') || '', color: get('vehicle3color') || '', make: get('vehicle3make') || '', model: get('vehicle3model') || '' }
                            ].filter(vehicle => vehicle.name || vehicle.plateNumber || vehicle.state || vehicle.color || vehicle.make || vehicle.model),
                            createdAt: Date.now()
                        };
                    });

                    // Add imported members to existing plans (no new plan creation)
                    setAccounts(prev => prev.map((account, idx) => {
                        if (idx !== activeAccountIndex) return account;

                        // Get current max member ID across all plans
                        let maxMemberId = (account.subscriptionPlans || [])
                            .flatMap(plan => plan.SubscriptionMembers || [])
                            .reduce((max, m) => Math.max(max, m.SubscriptionMemberId || 0), 0);

                        // Update existing plans by adding members to their respective plans
                        const updatedPlans: SubscriptionPlan[] = (account.subscriptionPlans || []).map(plan => {
                            // Find members that belong to this plan
                            const membersForThisPlan = newMembers.filter(member => member.SubscriptionId === plan.SubscriptionId);
                            
                            if (membersForThisPlan.length > 0) {
                                // Add these members to this plan with proper member IDs
                                const newMembersWithIds: memberInfo[] = membersForThisPlan.map(member => {
                                    maxMemberId += 1;
                                    return {
                                        ...member,
                                        SubscriptionMemberId: maxMemberId,
                                        SubscriptionId: plan.SubscriptionId // Ensure it matches the plan
                                    };
                                });

                                return {
                                    ...plan,
                                    SubscriptionMembers: [
                                        ...(plan.SubscriptionMembers || []),
                                        ...newMembersWithIds
                                    ]
                                };
                            } else {
                                // No new members for this plan, return as-is
                                return plan;
                            }
                        });

                        return {
                            ...account,
                            subscriptionPlans: updatedPlans
                        };
                    }));

                    setImportSuccess(`Successfully imported ${newMembers.length} parker(s) to existing subscription plans!`);
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                }
            } catch (err: any) {
                setImportError(err.message || 'Failed to import parker data.');
            } finally {
                setIsParkerImporting(false);
            }
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };
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
    'Use account address as billing address? (Y/N)',
    ];

    // Download Data Template
    const handleAccountDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([ACCOUNT_TEMPLATE_HEADERS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'AccountTemplate');
        XLSX.writeFile(wb, 'AccountDataTemplate.xlsx');
    };

    // Import Account Data
    const handleImportAccountData = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImportError(null);
        setImportSuccess(null);
        setIsAccountImporting(true);
        const file = e.target.files?.[0];
        if (!file) {
            setIsAccountImporting(false);
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            if (!data) {
                setIsAccountImporting(false);
                return;
            }
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
                    const newId = getNextAccountId();
                    const newSubscriptionId = getNextSubscriptionId();
                    addActiveAccountId(newId); // Add to active tracking list
                    addActiveSubscriptionId(newSubscriptionId);
                    return {
                        RunId: 10,
                        AccountId: newId,
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
                                SubscriptionId: newSubscriptionId,
                                SubscriptionName: `${get('firstname') || ''} ${get('lastname') || ''}` || ' ',
                                SubscriptionType: 'EVERGREEN',
                                SubscriptionEffectiveDate: new Date(),
                                SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                                SubscriptionMembers: [
                                    {
                                        SubscriptionId: newSubscriptionId,
                                        SubscriptionMemberId: 1,
                                        SubscriptionMemberFirstName: get('firstname') || '',
                                        SubscriptionMemberLastName: get('lastname') || '',
                                        SubscriptionMemberEmail: get('email') || '',
                                        SubscriptionMemberPhone: get('phone') || '',
                                        SubscriptionMemberRateplanName: `${get('firstname') || ''} ${get('lastname') || ''} 1` || ' ',
                                        accessCodes: [],
                                        assignedUnits: [],
                                        vehicles: []
                                    }
                                ]
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
            } finally {
                setIsAccountImporting(false);
            }
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const addMember = () => {
        // Add member to the first subscription plan (if exists)
        if (!currentAccount.subscriptionPlans || currentAccount.subscriptionPlans.length === 0) return;
        
        // Find the highest existing SubscriptionMemberId across all plans and increment
        const allMembers = (currentAccount.subscriptionPlans || []).flatMap(plan => plan.SubscriptionMembers || []).sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
        const maxId = allMembers.reduce((max, m) => Math.max(max, m.SubscriptionMemberId || 0), 0);
        const planId = currentAccount.subscriptionPlans[0].SubscriptionId;
        
        const newMember = {
            SubscriptionId: planId,
            SubscriptionMemberId: maxId + 1,
            SubscriptionMemberFirstName: '',
            SubscriptionMemberLastName: '',
            SubscriptionMemberEmail: '',
            SubscriptionMemberPhone: '',
            SubscriptionMemberRateplanName: '',
            accessCodes: [],
            assignedUnits: [],
            vehicles: [],
            createdAt: Date.now()
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

        // Auto-expand the accordion for the new member
        const newAccordionKey = `${planId}-${maxId + 1}`;
        setExpandedAccordions(prev => new Set([...prev, newAccordionKey]));
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
                        
                        {/* Account Dropdown */}
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControl sx={{ minWidth: 300 }}>
                                <InputLabel id="account-select-label">Select Account</InputLabel>
                                <Select
                                    labelId="account-select-label"
                                    value={activeAccountIndex}
                                    label="Select Account"
                                    onChange={(e) => setActiveAccountIndex(Number(e.target.value))}
                                >
                                    {accounts.map((account, index) => (
                                        <MenuItem key={index} value={index}>
                                            Account {account.AccountId}: {account.AccountFirstName || ''} {account.AccountLastName || ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            {/* Delete Account Button */}
                            {accounts.length > 1 && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => deleteAccount(activeAccountIndex)}
                                    sx={{ 
                                        borderColor: '#B20838',
                                        color: '#B20838',
                                        '&:hover': {
                                            borderColor: '#8e0629',
                                            backgroundColor: 'rgba(178, 8, 56, 0.04)',
                                            variant: "contained"
                                        }
                                    }}
                                >
                                    Delete Current Account
                                </Button>
                            )}
                        </Box>
                    </Paper>

                    {/* --- TOP OF FORM: Data Template Download & Import UI --- */}
                    <Paper sx={{ p: 4, my: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600, mr: 1, mb: 1 }}>
                                Data Template and Import
                            </Typography>
                            <Tooltip title="Download the data template, copy and paste your account information, save the file, then import the data">
                                <InfoIcon sx={{ color: '#007dba', fontSize: 20 }} />
                            </Tooltip>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAccountDownloadTemplate}
                                sx={{ fontWeight: 600 }}
                            >
                                Download Account Data Template
                            </Button>
                            <label htmlFor="import-account-data" style={{ marginBottom: 0 }}>
                                <input
                                    id="import-account-data"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    style={{ display: 'none' }}
                                    onChange={handleImportAccountData}
                                    disabled={isAccountImporting}
                                />
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    component="span"
                                    sx={{ fontWeight: 600 }}
                                    disabled={isAccountImporting}
                                    startIcon={isAccountImporting ? <CircularProgress size={20} color="inherit" /> : undefined}
                                >
                                    {isAccountImporting ? 'Importing...' : 'Import Account Data'}
                                </Button>
                            </label>
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
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ flexBasis: { xs: '100%', md: '9%' } }}>
                                <TextField
                                    fullWidth
                                    label="Account ID *"
                                    type="number"
                                    value={currentAccount.AccountId || ''}
                                    onChange={(e) => handleInputChange('AccountId', parseInt(e.target.value))}
                                    error={!!errors.AccountId}
                                    helperText={errors.AccountId}
                                    disabled
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 200 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '23%' }, minWidth: 200 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '38%' }, minWidth: 250 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '34.5%' }, minWidth: 250 }}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={currentAccount.AccountPhone || ''}
                                    onChange={(e) => handlePhoneChange('AccountPhone', e.target.value)}
                                    error={!!errors.AccountPhone}
                                    helperText={errors.AccountPhone}
                                    placeholder="(XXX)XXX-XXXX"
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '36%' }, minWidth: 300 }}>
                                <TextField
                                    fullWidth
                                    label="Address Line 1"
                                    value={currentAccount.AccountAddress1 || ''}
                                    onChange={(e) => handleInputChange('AccountAddress1', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '24%' }, minWidth: 200 }}>
                                <TextField
                                    fullWidth
                                    label="Address Line 2"
                                    value={currentAccount.AccountAddress2 || ''}
                                    onChange={(e) => handleInputChange('AccountAddress2', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '20%' }, minWidth: 150 }}>
                                <TextField
                                    fullWidth
                                    label="City"
                                    value={currentAccount.AccountCity || ''}
                                    onChange={(e) => handleInputChange('AccountCity', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '19%' }, minWidth: 150 }}>
                                <TextField
                                    fullWidth
                                    label="Postal Code"
                                    value={currentAccount.AccountPostalCode || ''}
                                    onChange={(e) => handleInputChange('AccountPostalCode', e.target.value)}
                                    error={!!errors.AccountPostalCode}
                                    helperText={errors.AccountPostalCode}
                                    placeholder="12345 or A1A 1A1"
                                    required={false}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '14%' }, minWidth: 150 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '12%' }, minWidth: 150 }}>
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

                            <Box sx={{ flexBasis: { xs: '100%', md: '25%' }, minWidth: 250 }}>
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
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ flexBasis: { xs: '100%', md: '29%' }, minWidth: 200 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '29%' }, minWidth: 200 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '36%' }, minWidth: 250 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '30%' }, minWidth: 250 }}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={currentAccount.AccountBillToPhone || ''}
                                    onChange={(e) => handlePhoneChange('AccountBillToPhone', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToPhone}
                                    helperText={errors.AccountBillToPhone}
                                    placeholder="(XXX)XXX-XXXX"
                                />
                            </Box>

                            <Box sx={{ flexBasis: { xs: '100%', md: '40%' }, minWidth: 300 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '24%' }, minWidth: 200 }}>
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
                            <Box sx={{ml:9, flexBasis: { xs: '100%', md: '25%' }, minWidth: 150 }}>
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
                            <Box sx={{ flexBasis: { xs: '100%', md: '25%' }, minWidth: 150 }}>
                                <TextField
                                    fullWidth
                                    label="Postal Code"
                                    value={currentAccount.AccountBillToPostalCode || ''}
                                    onChange={(e) => handleInputChange('AccountBillToPostalCode', e.target.value)}
                                    disabled={copyAccountToBilling}
                                    error={!!errors.AccountBillToPostalCode}
                                    helperText={errors.AccountBillToPostalCode}
                                    placeholder="12345 or A1A 1A1"
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '14%' }, minWidth: 150 }}>
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
                                            label="State"
                                            error={!!errors.AccountBillToState}
                                            helperText={errors.AccountBillToState}
                                            required
                                        />
                                    )}
                                />
                            </Box>
                            <Box sx={{ flexBasis: { xs: '100%', md: '12%' }, minWidth: 150 }}>
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
                                    const newSubscriptionId = getNextSubscriptionId();
                                    
                                    setAccounts(prev => prev.map((account, idx) => {
                                        if (idx !== activeAccountIndex) return account;
                                        
                                        // Find the max SubscriptionMemberId across ALL plans and members
                                        const allMembers = (account.subscriptionPlans || []).flatMap(plan => plan.SubscriptionMembers || []);
                                        const maxMemberId = allMembers.reduce((max, m) => Math.max(max, m.SubscriptionMemberId || 0), 0);
                                        const nextMemberId = maxMemberId + 1;

                                        const newPlan: SubscriptionPlan = {
                                            SubscriptionId: newSubscriptionId,
                                            SubscriptionName: `${currentAccount.AccountFirstName || ''} ${currentAccount.AccountLastName || ''}` || ' ',
                                            SubscriptionType: 'EVERGREEN',
                                            SubscriptionEffectiveDate: firstOfMonth,
                                            SubscriptionInvoiceTemplate: 'LAZ_STANDARD',
                                            SubscriptionMembers: [{
                                                SubscriptionId: newSubscriptionId,
                                                SubscriptionMemberId: nextMemberId,
                                                SubscriptionMemberFirstName: currentAccount.AccountFirstName || '',
                                                SubscriptionMemberLastName: currentAccount.AccountLastName || '',
                                                SubscriptionMemberEmail: currentAccount.AccountEmail || '',
                                                SubscriptionMemberPhone: currentAccount.AccountPhone || '',
                                                SubscriptionMemberRateplanName: '',
                                                accessCodes: [],
                                                assignedUnits: [],
                                                vehicles: []
                                            }]
                                        }
                                        
                                        addActiveSubscriptionId(newSubscriptionId);
                                        
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
                            <Button variant="outlined"
                                sx={{ ml: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', px: 2, py: 1 }}
                                onClick={() => {
                                    const now = new Date();
                                    let year = now.getFullYear();
                                    let month = now.getMonth() + 1;
                                    if (now.getMonth() === 11) {
                                        year = now.getFullYear() + 1;
                                        month = 1;
                                    }
                                    const firstOfMonth = new Date(year, month, 1);
                                    setAccounts(prev => prev.map((account, idx) => 
                                        idx === activeAccountIndex
                                            ? {
                                                ...account,
                                                subscriptionPlans: (account.subscriptionPlans || []).map(plan => ({
                                                    ...plan,
                                                    SubscriptionName: `${currentAccount.AccountFirstName || ''} ${currentAccount.AccountLastName || ''}` || ' ',
                                                    SubscriptionType: 'EVERGREEN',
                                                    SubscriptionEffectiveDate: firstOfMonth,
                                                    SubscriptionInvoiceTemplate: 'LAZ_STANDARD'
                                                }))
                                            }
                                            : account
                                    ));
                                }}
                            >
                                autofill basic info
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
                                        <TableRow key={plan.SubscriptionId}>
                                            <TableCell align="center">
                                                <IconButton
                                                    onClick={() => {removePlan(plan.SubscriptionId)}}
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
                                                                        p.SubscriptionId === plan.SubscriptionId ? { ...p, SubscriptionId: value } : p
                                                                    )
                                                                }
                                                                : account
                                                        ));
                                                    }}
                                                    disabled
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={plan.SubscriptionName ||  ' '}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setAccounts(prev => prev.map((account, idx) => 
                                                            idx === activeAccountIndex
                                                                ? {
                                                                    ...account,
                                                                    subscriptionPlans: (account.subscriptionPlans || []).map((p: any) =>
                                                                        p.SubscriptionId === plan.SubscriptionId ? { ...p, SubscriptionName: value } : p
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
                                                                        ...account,                                                                    subscriptionPlans: (account.subscriptionPlans || []).map((p: any) =>
                                                                        p.SubscriptionId === plan.SubscriptionId ? { ...p, SubscriptionType: value } : p
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
                                                                        p.SubscriptionId === plan.SubscriptionId ? { ...p, SubscriptionEffectiveDate: value } : p
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
                                                                        ...account,                                                                    subscriptionPlans: (account.subscriptionPlans || []).map((p: any) =>
                                                                        p.SubscriptionId === plan.SubscriptionId ? { ...p, SubscriptionInvoiceTemplate: value } : p
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

<Box sx={{ mt: 3, justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Typography variant="h5" sx={{ color: '#B20838', fontWeight: 600 }}>
        Members
    </Typography>
    <Typography variant="body1" color='#B20838' sx={{ ml: 0.5, mt: 0.7 }}>
        (Parkers)
    </Typography>
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1, ml: 2 }}>
        <Button
            variant="contained"
        color="primary"
        onClick={handleParkerDownloadTemplate}
        sx={{ fontWeight: 600 }}
        >
            Download Parker Data Template
        </Button>
        <label htmlFor="import-parker-data" style={{ marginBottom: 0 }}>
            <input
                id="import-parker-data"
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleImportParkerData}
                disabled={isParkerImporting}
            />
            <Button
                variant="contained"
                color="secondary"
                component="span"
                sx={{ fontWeight: 600 }}
                disabled={isParkerImporting}
                startIcon={isParkerImporting ? <CircularProgress size={20} color="inherit" /> : undefined}
            >
                {isParkerImporting ? 'Importing...' : 'Import Parker Data'}
            </Button>
        </label>
    </Box>
    {importError && (
        <Alert severity="error" sx={{ ml: 2 }}>{importError}</Alert>
    )}
    {importSuccess && (
        <Alert severity="success" sx={{ ml: 2 }}>{importSuccess}</Alert>
    )}
  </Box>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={addMember}
      sx={{
        ml: 3,
        backgroundColor: '#007dba',
        '&:hover': { backgroundColor: '#005a94' },
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.95rem',
        px: 2
        }}
    >
      Add Member
    </Button>
</Box>

  {/* Member Plan Warning */}
  {memberPlanWarning && (
    <Alert severity="warning" sx={{ mb: 2, mt: 2 }} onClose={() => setMemberPlanWarning(null)}>
      {memberPlanWarning}
    </Alert>
  )}

  {(currentAccount.subscriptionPlans || []).flatMap(plan => plan.SubscriptionMembers || []).length === 0 && (
    <Box sx={{
      textAlign: 'center',
      py: 3,
      backgroundColor: '#f8f9fa',
      borderRadius: 2,
      border: '2px dashed #dee2e6'
    }}>
      <Typography variant="body2" color="text.secondary">
        No members added yet. Click "Add Member" to get started.
      </Typography>
    </Box>
  )}

  {(currentAccount.subscriptionPlans || []).flatMap(plan => plan.SubscriptionMembers || []).map((member, idx) => {
    const accordionKey = `${member.SubscriptionMemberId}`;
    return (
    <Accordion 
      key={accordionKey} 
      sx={{ mb: 2 }}
      expanded={expandedAccordions.has(accordionKey)}
      onChange={(_, isExpanded) => {
        setExpandedAccordions(prev => {
          const newSet = new Set(prev);
          if (isExpanded) {
            newSet.add(accordionKey);
          } else {
            newSet.delete(accordionKey);
          }
          return newSet;
        });
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ flex: 1 }}>
        {member.SubscriptionMemberFirstName} {member.SubscriptionMemberLastName} (ID: {member.SubscriptionMemberId})
        {(() => {
            const plan = (currentAccount.subscriptionPlans || []).find(p => p.SubscriptionId === member.SubscriptionId);
            return plan ? ` — Plan: ${plan.SubscriptionName || plan.SubscriptionId}` : '';
        })()}
        </Typography>
        <IconButton
          onClick={() => removeMember(String(member.SubscriptionMemberId))}
          size="small"
          sx={{ color: '#B20838' }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </AccordionSummary>
      <AccordionDetails>
        {/* Member Info */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Member Information</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
          <TextField
            label="First Name"
            value={member.SubscriptionMemberFirstName || ''}
            onChange={e => {
              const value = e.target.value;
              setAccounts(prev => prev.map((account, accountIdx) =>
                accountIdx === activeAccountIndex
                  ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((plan) =>
                      plan.SubscriptionId === member.SubscriptionId
                        ? {
                          ...plan,
                          SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                            mIdx === idx ? { ...m, SubscriptionMemberFirstName: value } : m
                          )
                        }
                        : plan
                    )
                  }
                  : account
              ));
            }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Last Name"
            value={member.SubscriptionMemberLastName  || ''}
            onChange={e => {
              const value = e.target.value;
              setAccounts(prev => prev.map((account, accountIdx) =>
                accountIdx === activeAccountIndex
                  ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((plan) =>
                      plan.SubscriptionId === member.SubscriptionId
                        ? {
                          ...plan,
                          SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                            mIdx === idx ? { ...m, SubscriptionMemberLastName: value } : m
                          )
                        }
                        : plan
                    )
                  }
                  : account
              ));
            }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Email"
            value={member.SubscriptionMemberEmail || ''}
            onChange={e => {
              const value = e.target.value;
              setAccounts(prev => prev.map((account, accountIdx) =>
                accountIdx === activeAccountIndex
                  ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((plan) =>
                      plan.SubscriptionId === member.SubscriptionId
                        ? {
                          ...plan,
                          SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                            mIdx === idx ? { ...m, SubscriptionMemberEmail: value } : m
                          )
                        }
                        : plan
                    )
                  }
                  : account
              ));
            }}
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Phone"
            value={member.SubscriptionMemberPhone || ''}
            onChange={e => {
              const value = e.target.value;
              setAccounts(prev => prev.map((account, accountIdx) =>
                accountIdx === activeAccountIndex
                  ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((plan) =>
                      plan.SubscriptionId === member.SubscriptionId
                        ? {
                          ...plan,
                          SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                            mIdx === idx ? { ...m, SubscriptionMemberPhone: value } : m
                          )
                        }
                        : plan
                    )
                  }
                  : account
              ));
            }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Rate Plan Name"
            value={member.SubscriptionMemberRateplanName || ''}
            onChange={e => {
              const value = e.target.value;
              setAccounts(prev => prev.map((account, accountIdx) =>
                accountIdx === activeAccountIndex
                  ? {
                    ...account,
                    subscriptionPlans: (account.subscriptionPlans || []).map((plan) =>
                      plan.SubscriptionId === member.SubscriptionId
                        ? {
                          ...plan,
                          SubscriptionMembers: (plan.SubscriptionMembers || []).map((m, mIdx) =>
                            mIdx === idx ? { ...m, SubscriptionMemberRateplanName: value } : m
                          )
                        }
                        : plan
                    )
                  }
                  : account
              ));
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl fullWidth >
            <InputLabel id={`member-plan-select-label-${member.SubscriptionMemberId}`}>Subscription Plan</InputLabel>
            <Select
            labelId={`member-plan-select-label-${member.SubscriptionMemberId}`}
            value={member.SubscriptionId || (currentAccount.subscriptionPlans?.[0]?.SubscriptionId ?? '')}
            label="Subscription Plan"
            onChange={e => {
                const newPlanId = Number(e.target.value);
                
                // Find the selected plan to get its name
                const selectedPlan = (currentAccount.subscriptionPlans || []).find(plan => plan.SubscriptionId === newPlanId);
                
                // Check if moving this member will leave the old plan with no members
                const oldPlan = (currentAccount.subscriptionPlans || []).find(plan => plan.SubscriptionId === member.SubscriptionId);
                const oldPlanMemberCount = (oldPlan?.SubscriptionMembers || []).length;
                const willLeaveOldPlanEmpty = oldPlanMemberCount === 1;

                // Show warning if moving this member will leave the old plan empty
                if (willLeaveOldPlanEmpty && newPlanId !== member.SubscriptionId) {
                    setMemberPlanWarning(
                        `Warning: Moving ${member.SubscriptionMemberFirstName || ''} ${member.SubscriptionMemberLastName || ''} (ID: ${member.SubscriptionMemberId}) will leave subscription plan "${oldPlan?.SubscriptionName || oldPlan?.SubscriptionId}" with no members.`
                    );
                    // Auto-hide warning after 5 seconds
                    setTimeout(() => setMemberPlanWarning(null), 5000);
                } else {
                    setMemberPlanWarning(null);
                }

                // Keep accordion expanded after plan change
                const currentAccordionKey = `${member.SubscriptionId}-${member.SubscriptionMemberId}`;
                const newAccordionKey = `${newPlanId}-${member.SubscriptionMemberId}`;
                
                setExpandedAccordions(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(currentAccordionKey); // Remove old key
                    newSet.add(newAccordionKey); // Add new key
                    return newSet;
                });
                
                setAccounts(prev => prev.map((account, accountIdx) =>
                    accountIdx === activeAccountIndex
                        ? {
                            ...account,
                            subscriptionPlans: (account.subscriptionPlans || []).map((plan) => {
                                if (plan.SubscriptionId === member.SubscriptionId) {
                                    // Remove member from current plan by SubscriptionMemberId
                                    return {
                                        ...plan,
                                        SubscriptionMembers: (plan.SubscriptionMembers || []).filter(m => m.SubscriptionMemberId !== member.SubscriptionMemberId)
                                    };
                                } else if (plan.SubscriptionId === newPlanId) {
                                    // Add member to new plan with updated info
                                    return {
                                        ...plan,
                                        SubscriptionMembers: [
                                            ...(plan.SubscriptionMembers || []),
                                            {
                                                ...member,
                                                SubscriptionId: newPlanId,
                                                // Optionally update rate plan name to match subscription plan name
                                                SubscriptionMemberRateplanName: selectedPlan?.SubscriptionName || member.SubscriptionMemberRateplanName
                                            }
                                        ]
                                    };
                                } else {
                                    return plan;
                                }
                            })
                        }
                        : account
                ));
            }}
            >
            {(currentAccount.subscriptionPlans || []).map(plan => (
                <MenuItem key={plan.SubscriptionId} value={plan.SubscriptionId}>
                {plan.SubscriptionId} {plan.SubscriptionName ? `- ${plan.SubscriptionName}` : ''}
                </MenuItem>
            ))}
            </Select>
          </FormControl>
        </Box>

        {/* Access Codes */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{accessCodeLabel}</Typography>
          {(member.accessCodes || []).map((code, codeIdx) => (
            <Box key={code.id || codeIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 1 }}>
                <TextField
                    label="Code"
                    value={code.code}
                    onChange={e => updateAccessCode(member.SubscriptionId, member.SubscriptionMemberId, code.id, 'code', e.target.value)}
                    sx={{ minWidth: 120 }}
                />
                <FormControl sx={{ minWidth: 100 }}>
                    <InputLabel id={`access-code-type-label-${member.SubscriptionMemberId}-${codeIdx}`}>Type</InputLabel>
                    <Select
                    labelId={`access-code-type-label-${member.SubscriptionMemberId}-${codeIdx}`}
                    value={code.type}
                    label="Type"
                    onChange={e => updateAccessCode(member.SubscriptionId, member.SubscriptionMemberId, code.id, 'type', e.target.value)}
                    >
                    {accessCodeTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                    </Select>
                </FormControl>
              <IconButton onClick={() => removeAccessCode(code.id)} size="small"><DeleteIcon /></IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              const newCode: AccessCode = {
                id: (member.accessCodes.length + 1).toString(),
                code: '',
                type: ''
              };
              addAccessCode(member.SubscriptionId, member.SubscriptionMemberId, newCode);
            }}
            disabled={member.accessCodes.length >= 3}
            sx={{ mt: 1 }}
          >
            Add Access Code
          </Button>
        </Box>

        {/* Assigned Units */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{assignedUnitLabel}</Typography>
          {(member.assignedUnits || []).map((unit, unitIdx) => (
            <Box key={unit.id || unitIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 , mt: 1 }}>
              <TextField
                label="Unit"
                value={unit.unit}
                onChange={e => updateAssignedUnit(member.SubscriptionId, member.SubscriptionMemberId, unit.id, 'unit', e.target.value)}
                sx={{ minWidth: 120 }}
              />
              <IconButton onClick={() => removeAssignedUnit(unit.id)} size="small"><DeleteIcon /></IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              const newUnit: AssignedUnit = {
                id: (member.assignedUnits.length + 1).toString(),
                unit: ''
              };
              addAssignedUnit(member.SubscriptionId, member.SubscriptionMemberId, newUnit);
            }}
            disabled={member.assignedUnits.length >= 1}
            sx={{ mt: 1 }}
          >
            Add Assigned Unit
          </Button>
        </Box>

        {/* Vehicles */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Vehicles</Typography>
          {(member.vehicles || []).map((vehicle, vehicleIdx) => (
            <Box key={vehicle.id || vehicleIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 , mt: 1 }}>
              <TextField
                label="Name"
                value={vehicle.name}
                onChange={e => updateVehicle(member.SubscriptionId, member.SubscriptionMemberId, vehicle.id, 'name', e.target.value)}
                sx={{ minWidth: 100 }}
              />
              <TextField
                label="Plate"
                value={vehicle.plateNumber}
                onChange={e => updateVehicle(member.SubscriptionId, member.SubscriptionMemberId, vehicle.id, 'plateNumber', e.target.value)}
                sx={{ minWidth: 100 }}
              />
              <TextField
                label="Make"
                value={vehicle.make}
                onChange={e => updateVehicle(member.SubscriptionId, member.SubscriptionMemberId, vehicle.id, 'make', e.target.value)}
                sx={{ minWidth: 100 }}
              />
              <TextField
                label="Model"
                value={vehicle.model}
                onChange={e => updateVehicle(member.SubscriptionId, member.SubscriptionMemberId, vehicle.id, 'model', e.target.value)}
                sx={{ minWidth: 100 }}
              />
              <TextField
                label="Color"
                value={vehicle.color}
                onChange={e => updateVehicle(member.SubscriptionId, member.SubscriptionMemberId, vehicle.id, 'color', e.target.value)}
                sx={{ minWidth: 80 }}
              />
              <TextField
                label="State"
                value={vehicle.state}
                onChange={e => updateVehicle(member.SubscriptionId, member.SubscriptionMemberId, vehicle.id, 'state', e.target.value)}
                sx={{ minWidth: 80 }}
              />
              <IconButton onClick={() => removeVehicle(vehicle.id)} size="small"><DeleteIcon /></IconButton>
            </Box>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              const newVehicle: Vehicle = {
                id: (member.vehicles.length + 1).toString(),
                name: '',
                plateNumber: '',
                make: '',
                model: '',
                color: '',
                state: ''
              };
              addVehicle(member.SubscriptionId, member.SubscriptionMemberId, newVehicle);
            }}
            disabled={member.vehicles.length >= 3}
            sx={{ mt: 1 }}
          >
            Add Vehicle
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
  })}

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
                            Generate Subscription
                        </Button>
                    </Box>
                </form>
            </Box>
        </ThemeProvider>
    );
};


export default SubscriptionForm;

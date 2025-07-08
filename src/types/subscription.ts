export interface AccessCode {
    id?: string;
    code: string;
    type: string;
}

export interface AssignedUnit {
    id?: string;
    unit: string;
}

export interface Vehicle {
    id: string;
    name: string;
    plateNumber: string;
    make: string;
    model: string;
    color: string;
    state: string;
}

export interface SubscriptionPlan {
    SubscriptionId: number;
    SubscriptionName: string;
    SubscriptionType: string;
    SubscriptionEffectiveDate: Date;
    SubscriptionInvoiceTemplate: string;
    SubscriptionMembers: memberInfo[];
    accessCodes: AccessCode[];
    assignedUnits: AssignedUnit[];
    vehicles: Vehicle[];
    
}

export interface memberInfo {
    SubscriptionMemberId: number;
    SubscriptionMemberFirstName: string;
    SubscriptionMemberLastName: string;
    SubscriptionMemberEmail?: string;
    SubscriptionMemberPhone?: string;
    SubscriptionMemberRateplanName: string;
}

export interface SubscriptionData{
    RunId: number;
    AccountId: number;
    AccountFirstName: string;
    AccountLastName: string;
    AccountEmail: string;
    AccountPhone?: string;
    AccountAddress1?: string;
    AccountAddress2?: string;
    AccountCity?: string;
    AccountState: string;
    AccountPostalCode: string;
    AccountCountry: string;
    AccountType: string;
    AccountBillToName: string;
    AccountBillToFirstName: string;
    AccountBillToLastName: string;
    AccountBillToEmail: string;
    AccountBillToPhone?: string;
    AccountBillToAddress1?: string;
    AccountBillToAddress2?: string;
    AccountBillToCity?: string;
    AccountBillToState: string;
    AccountBillToPostalCode?: string;
    AccountBillToCountry: string;
    SubscriptionId: number;
    SubscriptionName: string;
    SubscriptionType: string;
    SubscriptionEffectiveDate: Date;
    SubscriptionInvoiceTemplate: string;
    SubscriptionDefaultLanguage?: string;
    SubscriptionTaxNumber1?: string;
    SubscriptionTaxNumber2?: string;
    SubscriptionMemberId: number;
    SubscriptionMemberFirstName: string;
    SubscriptionMemberLastName: string;
    SubscriptionMemberEmail?: string;
    SubscriptionMemberPhone?: string;
    SubscriptionMemberRateplanName: string;
    // Dynamic arrays for table-based sections
    
    accessCodes: AccessCode[];
    assignedUnits: AssignedUnit[];
    vehicles: Vehicle[];
    subscriptionPlans: SubscriptionPlan[];
    // Legacy fields for backward compatibility
    /*
    SubscriptionMemberId: number;
    SubscriptionMemberFirstName: string;
    SubscriptionMemberLastName: string;
    SubscriptionMemberEmail?: string;
    SubscriptionMemberPhone?: string;
    SubscriptionMemberRateplanName: string;
    accessCodes: AccessCode[];
    assignedUnits: AssignedUnit[];
    */
    SubscriptionAccessCode1?: string;
    SubscriptionAccessCodeType1?: string;
    SubscriptionAccessCode2?: string;
    SubscriptionAccessCodeType2?: string;
    SubscriptionAccessCode3?: string;
    SubscriptionAccessCodeType3?: string;
    SubscriptionMemberAssignedUnit1?: string;
    SubscriptionMemberAssignedUnit2?: string;
    SubscriptionMemberAssignedUnit3?: string;
    SubscriptionMemberVehicle1Name?: string;
    SubscriptionMemberVehicle1PlateNumber?: string;
    SubscriptionMemberVehicle1State?: string;
    SubscriptionMemberVehicle1Color?: string;
    SubscriptionMemberVehicle1Make?: string;
    SubscriptionMemberVehicle1Model?: string;
    SubscriptionMemberVehicle2Name?: string;
    SubscriptionMemberVehicle2PlateNumber?: string;
    SubscriptionMemberVehicle2State?: string;
    SubscriptionMemberVehicle2Color?: string;
    SubscriptionMemberVehicle2Make?: string;
    SubscriptionMemberVehicle2Model?: string;
    SubscriptionMemberVehicle3Name?: string;
    SubscriptionMemberVehicle3PlateNumber?: string;
    SubscriptionMemberVehicle3State?: string;
    SubscriptionMemberVehicle3Color?: string;
    SubscriptionMemberVehicle3Make?: string;
    SubscriptionMemberVehicle3Model?: string;
}



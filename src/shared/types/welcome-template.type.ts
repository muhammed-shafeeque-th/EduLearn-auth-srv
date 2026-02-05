export type WelcomeEmailTemplateData = {
  userName: string;
  email: string;
  dashboardUrl: string;
  supportEmail: string;
  helpCenterUrl: string;
  blogUrl: string;
  companyAddress: string;
  unsubscribeUrl: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  currentYear?: number;
  currentDate?: string;
};

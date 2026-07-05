export const welcomeTemplate = (customerName) => {
  return {
    subject: "Welcome to JeruTech",
    body: `Hello ${customerName},\n\nWelcome to JeruTech! Your account has been created successfully.\n\nThank you for joining us.`,
  };
};

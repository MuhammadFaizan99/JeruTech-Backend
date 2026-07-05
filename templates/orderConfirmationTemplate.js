// Functionality will be implemented later.

export const orderConfirmationTemplate = (order) => {
  // TODO: Implement order confirmation email/message template later
  return {
    subject: "Order Confirmation - JeruTech",
    body: `Your order has been placed successfully. Order ID: ${order?._id || "N/A"}`,
  };
};

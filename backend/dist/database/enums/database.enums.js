"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.OrderStatus = exports.PaymentStatus = exports.PaymentProvider = exports.SubscriptionStatus = exports.SubscriptionServiceType = exports.MessageDeliveryStatus = exports.MessageRecipientType = exports.FriendRequestStatus = exports.WorkStatus = exports.MaritalStatus = exports.Gender = void 0;
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
    Gender["OTHER"] = "other";
})(Gender || (exports.Gender = Gender = {}));
var MaritalStatus;
(function (MaritalStatus) {
    MaritalStatus["SINGLE"] = "single";
    MaritalStatus["MARRIED"] = "married";
    MaritalStatus["DIVORCED"] = "divorced";
    MaritalStatus["WIDOWED"] = "widowed";
})(MaritalStatus || (exports.MaritalStatus = MaritalStatus = {}));
var WorkStatus;
(function (WorkStatus) {
    WorkStatus["EMPLOYED"] = "employed";
    WorkStatus["NOT_EMPLOYED"] = "not_employed";
    WorkStatus["STUDENT"] = "student";
})(WorkStatus || (exports.WorkStatus = WorkStatus = {}));
var FriendRequestStatus;
(function (FriendRequestStatus) {
    FriendRequestStatus["PENDING"] = "pending";
    FriendRequestStatus["ACCEPTED"] = "accepted";
    FriendRequestStatus["REJECTED"] = "rejected";
})(FriendRequestStatus || (exports.FriendRequestStatus = FriendRequestStatus = {}));
var MessageRecipientType;
(function (MessageRecipientType) {
    MessageRecipientType["FRIEND"] = "friend";
    MessageRecipientType["CONTACT"] = "contact";
    MessageRecipientType["EXTERNAL"] = "external";
    MessageRecipientType["GROUP"] = "group";
})(MessageRecipientType || (exports.MessageRecipientType = MessageRecipientType = {}));
var MessageDeliveryStatus;
(function (MessageDeliveryStatus) {
    MessageDeliveryStatus["QUEUED"] = "queued";
    MessageDeliveryStatus["SENT"] = "sent";
    MessageDeliveryStatus["FAILED"] = "failed";
})(MessageDeliveryStatus || (exports.MessageDeliveryStatus = MessageDeliveryStatus = {}));
var SubscriptionServiceType;
(function (SubscriptionServiceType) {
    SubscriptionServiceType["JOKE"] = "joke";
    SubscriptionServiceType["CURRENT_AFFAIRS"] = "current_affairs";
    SubscriptionServiceType["SPORTS"] = "sports";
    SubscriptionServiceType["NEWS"] = "news";
})(SubscriptionServiceType || (exports.SubscriptionServiceType = SubscriptionServiceType = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["PENDING"] = "pending";
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["CANCELLED"] = "cancelled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["VNPAY"] = "vnpay";
    PaymentProvider["PAYPAL"] = "PAYPAL";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["CANCELLED"] = "cancelled";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["APPROVED"] = "approved";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["SUPERADMIN"] = "superadmin";
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=database.enums.js.map
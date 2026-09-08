package com.runout.payments.api;

public interface PaymentGateway {

    PaymentReceipt capture(CapturePaymentCommand command);
}

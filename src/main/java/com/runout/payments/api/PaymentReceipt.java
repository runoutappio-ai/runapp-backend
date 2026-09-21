package com.runout.payments.api;

import lombok.Builder;

@Builder
public record PaymentReceipt(String reference, String status) {
}

"use client";

import React, { ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import PlaceOrder from "./PlaceOrder";

interface ClientPlaceOrderProps {
  children: ReactNode;
}

const ClientPlaceOrder: React.FC<ClientPlaceOrderProps> = ({ children }) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = React.useState(false);

  return (
    <PlaceOrder isDesktop={isDesktop} open={open} setOpen={setOpen}>
      {children}
    </PlaceOrder>
  );
};

export default ClientPlaceOrder;

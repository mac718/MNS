import { useRouter } from "next/router";
import React from "react";
import axios from "axios";

const CheckoutButtons = (props) => {
  const [paid, setPaid] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [items, setItems] = React.useState([]);

  const paypalRef = React.useRef();
  const router = useRouter();

  React.useEffect(() => {
    let lineItems;
    let total;
    if (localStorage.getItem("items")) {
      setItems(JSON.parse(localStorage.getItem("items")));
      lineItems = JSON.parse(localStorage.getItem("items")).map((item) => {
        return {
          name: `${item.name} ${item.type}`,
          unit_amount: { value: String(item.price), currency_code: "USD" },
          quantity: item.quantity,
          description: `${item.name} ${item.type}`,
        };
      });

      lineItems = [
        ...lineItems,
        {
          name: `Shipping: ${props.shippingService[0]}`,
          unit_amount: {
            value: props.shippingService[1],
            currency_code: "USD",
          },
          quantity: 1,
          description: "Shipping",
        },
      ];

      if (localStorage.total) {
        total = localStorage.getItem("total");
      }
    }

    window.paypal
      .Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  value: Number(total) + Number(props.shippingService[1]),
                  breakdown: {
                    item_total: {
                      currency_code: "USD",
                      value: Number(total) + Number(props.shippingService[1]),
                    },
                  },
                },
                items: lineItems,
                description: "single order",
              },
            ],
          });
        },
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
          setPaid(true);
        },
        onError: (err) => {
          setError(err), console.error(err);
        },
        onShippingChange: async (data, actions) => {
          if (data.shipping_address.postal_code !== props.zip) {
            actions.reject();
          }
          actions.resolve();
        },
      })
      .render(paypalRef.current);
  }, []);

  if (paid) {
    let host =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://mns.vercel.app";
    try {
      axios
        .patch(`${host}/api/updateStock`, {
          items: items,
        })
        .then(() => {
          localStorage.clear();
          localStorage.setItem("paid", true);
        });
    } catch (err) {
      console.log(err);
      localStorage.clear();
      localStorage.setItem("paid", true);
    }

    router.push("/confirmation");
    return <div>Payment successful!</div>;
  }

  // If any error occurs
  if (error) {
    return <div>Error Occurred in processing payment! Please try again.</div>;
  }

  return <div ref={paypalRef}></div>;
};

export default CheckoutButtons;

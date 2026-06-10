import { useMemo, useState } from "react";
import {
  Apple,
  BadgeCheck,
  CreditCard,
  Lock,
  Wallet,
} from "lucide-react";
import applePayLogo from "../../../assets/payments_logos/apple-pay-svgrepo-com.svg";
import ecocashLogo from "../../../assets/payments_logos/ecocash.png";
import googlePayLogo from "../../../assets/payments_logos/google-pay-svgrepo-com.svg";
import innbucksLogo from "../../../assets/payments_logos/innbucks.png";
import mastercardLogo from "../../../assets/payments_logos/ma_symbol.svg";
import visaBlueLogo from "../../../assets/payments_logos/visa_blue.svg";
import zimSwitchLogo from "../../../assets/payments_logos/zwswitch.png"


type PaymentMethod =
  | "card"
  | "ecocash"
  | "innbucks"
  | "apple-pay"
  | "g-pay";

type PaymentLogo = {
  alt: string;
  src?: string;
  text?: string;
  height: number;
  width: number;
};

const paymentMethods: Array<{
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof CreditCard;
  logo?: string;
  processorLogos?: PaymentLogo[];
  accent: string;
}> = [
  {
    id: "card",
    label: "Card payment",
    hint: "Visa, Mastercard, ZimSwitch",
    icon: CreditCard,
    processorLogos: [
      { alt: "Visa", src: visaBlueLogo, height: 24, width: 24 },
      { alt: "Mastercard", src: mastercardLogo, height: 24, width: 24},
      { alt: "ZimSwitch", src: zimSwitchLogo, height: 24, width: 24 },
    ],
    accent: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    id: "ecocash",
    label: "EcoCash",
    hint: "Mobile money",
    icon: Wallet,
    logo: ecocashLogo,
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    id: "innbucks",
    label: "Innbucks",
    hint: "Wallet payment",
    icon: Wallet,
    logo: innbucksLogo,
    accent: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    id: "apple-pay",
    label: "Apple Pay",
    hint: "Digital wallet",
    icon: Apple,
    logo: applePayLogo,
    accent: "border-slate-200 bg-slate-100 text-slate-900",
  },
  {
    id: "g-pay",
    label: "G Pay",
    hint: "Digital wallet",
    icon: Wallet,
    logo: googlePayLogo,
    accent: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
];

const checkoutItems = [
  { name: "Sabhuku AI Pro", detail: "Monthly workspace subscription", price: 24 },
  { name: "Model credits", detail: "100 hosted inference credits", price: 16 },
];

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

export function CheckoutForm() {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [savePayment, setSavePayment] = useState(true);

  const selectedMethod = paymentMethods.find((item) => item.id === method) ?? paymentMethods[0];
  const total = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price, 0),
    [],
  );
  const isCard = method === "card";
  const isMobileMoney = method === "ecocash" || method === "innbucks";
  const SelectedIcon = selectedMethod.icon;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Checkout</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-gray-950">
                Complete your payment
              </h1>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              <Lock className="h-4 w-4" />
              Secured
            </div>
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paymentMethods.map((item) => {
              const Icon = item.icon;
              const active = item.id === method;
              const isCardOption = item.id === "card";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethod(item.id)}
                  aria-label={item.label}
                  className={`flex min-h-20 items-center gap-3 rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-blue-500 bg-blue-50 shadow-sm ring-4 ring-blue-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {isCardOption ? (
                    <>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${item.accent}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-950">{item.label}</span>
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          {item.processorLogos?.map((logo) => (
                            <span
                              key={logo.alt}
                              className="flex h-8 min-w-14 items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700"
                            >
                              {logo.src ? (
                                <img className="max-h-5 max-w-20 object-contain" src={logo.src} height={logo.height} width={logo.width} alt={logo.alt} />
                              ) : (
                                logo.text
                              )}
                            </span>
                          ))}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="flex min-h-12 flex-1 items-center justify-center">
                      <img className="max-h-20 max-w-24 object-contain" src={item.logo} alt={item.label} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${selectedMethod.accent}`}>
                  <SelectedIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-950">{selectedMethod.label}</h2>
                  <p className="text-sm text-gray-500">{selectedMethod.hint}</p>
                </div>
              </div>

              {isCard && (
                <div className="grid gap-4">
                  <label>
                    <span className={labelClass}>Name on card</span>
                    <input className={inputClass} placeholder="Tinashe Mutasa" autoComplete="cc-name" />
                  </label>
                  <label>
                    <span className={labelClass}>Card number</span>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      autoComplete="cc-number"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className={labelClass}>Expiry</span>
                      <input className={inputClass} placeholder="MM/YY" autoComplete="cc-exp" />
                    </label>
                    <label>
                      <span className={labelClass}>CVC</span>
                      <input className={inputClass} inputMode="numeric" placeholder="123" autoComplete="cc-csc" />
                    </label>
                  </div>
                </div>
              )}

              {isMobileMoney && (
                <div className="grid gap-4">
                  <label>
                    <span className={labelClass}>Mobile number</span>
                    <input className={inputClass} inputMode="tel" placeholder="+263 77 123 4567" autoComplete="tel" />
                  </label>
                  <label>
                    <span className={labelClass}>Account name</span>
                    <input className={inputClass} placeholder="Tinashe Mutasa" autoComplete="name" />
                  </label>
                </div>
              )}

              {method === "apple-pay" && (
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-900"
                >
                  <Apple className="h-5 w-5" />
                  Pay with Apple Pay
                </button>
              )}

              {method === "g-pay" && (
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  <Wallet className="h-5 w-5" />
                  Pay with G Pay
                </button>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <input
                type="checkbox"
                checked={savePayment}
                onChange={(event) => setSavePayment(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">Save this payment method</span>
                <span className="block text-sm text-gray-500">Use it later for subscriptions and credit top-ups.</span>
              </span>
            </label>

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <BadgeCheck className="h-5 w-5" />
              Pay ${total.toFixed(2)}
            </button>
          </form>
        </section>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-gray-950">Order summary</h2>
          <div className="mt-5 space-y-4">
            {checkoutItems.map((item) => (
              <div key={item.name} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-700">
                  {item.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-950">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.detail}</p>
                </div>
                <p className="text-sm font-semibold text-gray-950">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-200 pt-5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Processing</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-gray-950">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            Payments are shown as a frontend checkout demo. Connect this form to your payment provider before taking real payments.
          </div>
        </aside>
      </div>
    </main>
  );
}

export default CheckoutForm;

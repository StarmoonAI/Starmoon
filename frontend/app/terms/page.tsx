import OurAddressSign from "../components/OurAddressSign";

export default async function Index() {
    return (
       flex w-full max-w-xl mx-auto mt-8 flex-col lg:w-1/2 px-4 gap-2 text-left m-2 bg-white text-black
            <p className="font-semibold text-2xl">
                Terms and Conditions for Starmoon AI
            </p>
            <p className="font-light text-md">Last Updated: 9/29/24</p>
            <div className="flex flex-col gap-4 my-4">
                <p>
                    {`Welcome to Starmoon AI ("we," "us," "our"). We offer engaging AI-characters on Starmoon devices that you can also converse with anytime through our website `}
                    <a
                        href="https://www.starmoon.app"
                        className="text-blue-400 underline"
                        target="_blank"
                    >
                        https://www.starmoon.app
                    </a>
                    {` (the "Service").`}
                </p>
                <p>
                    Please read these Terms and Conditions (&quot;Terms&quot;)
                    carefully before using our Service. These Terms govern your
                    access to and use of our Service and any related services
                    provided by us. By accessing or using the Service, you agree
                    to be bound by these Terms. If you disagree with any part of
                    the Terms, then you may not access the Service.
                </p>
                <p className="text-lg font-semibold">1. Use of the Service</p>
                <p>
                    The Service is intended for personal and non-commercial use
                    unless explicitly agreed upon in writing by us. You agree
                    not to misuse the Service or help anyone else do so.
                </p>

                <p className="text-lg font-semibold">2. Accounts</p>
                <p>
                    When creating an account with us, you must provide accurate
                    and complete information. You are responsible for
                    safeguarding your account and for all activities or actions
                    under your account.
                </p>
                <p className="text-lg font-semibold">
                    3. Intellectual Property
                </p>
                <p>
                    The Service and its original content, features, and
                    functionality are and will remain the exclusive property of
                    Starmoon AI and its licensors.
                </p>
                <p className="text-lg font-semibold">
                    4. Links to Other Web Sites
                </p>
                <p>
                    Our Service may contain links to third-party web sites or
                    services that are not owned or controlled by Starmoon AI. We
                    have no control over, and assume no responsibility for, the
                    content, privacy policies, or practices of any third-party
                    web sites or services.
                </p>
                <p className="text-lg font-semibold">5. Termination</p>
                <p>
                    We may terminate or suspend access to our Service
                    immediately, without prior notice or liability, for any
                    reason whatsoever, including, without limitation, if you
                    breach the Terms.
                </p>
                <p className="text-lg font-semibold">
                    6. Limitation of Liability
                </p>
                <p>
                    In no event shall Starmoon AI, nor its directors, employees,
                    partners, agents, suppliers, or affiliates, be liable for
                    any indirect, incidental, special, consequential, or
                    punitive damages resulting from your use of the Service.
                </p>
                <p className="text-lg font-semibold">7. Governing Law</p>
                <p>
                    We reserve the right to update this privacy policy at any
                    time. When we do, we will post a notification on our
                    website. Your continued use of the site and services
                    following the posting of changes to this policy will be
                    deemed your acceptance of those changes.
                </p>
                <p className="text-lg font-semibold">8. Changes</p>
                <p>
                    We reserve the right, at our sole discretion, to modify or
                    replace these Terms at any time. What constitutes a material
                    change will be determined at our sole discretion.
                </p>
                <p className="text-lg font-semibold">9. Contact Us</p>
                <p>
                    If you have any questions about these Terms, please contact
                    me at
                </p>
                <OurAddressSign />
            </div>
        </div>
    );
}

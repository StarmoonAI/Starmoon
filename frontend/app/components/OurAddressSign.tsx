const OurAddressSign = () => {
    return (
        <div className="p-4">
            <div className="mb-4">
                <p className="text-lg font-semibold">Co-founders, Starmoon AI</p>
                <p>
                    <strong>Akashdeep Deb:</strong> 
                    <a 
                        href="mailto:akash@starmoon.app" 
                        className="text-blue-500 underline ml-1"
                    >
                        akash@starmoon.app
                    </a>
                </p>
                <p>
                    <strong>Junru Xiong:</strong> 
                    <a 
                        href="mailto:junru@starmoon.app" 
                        className="text-blue-500 underline ml-1"
                    >
                        junru@starmoon.app
                    </a>
                </p>
            </div>

            <div className="mb-4">
                <strong className="underline">US Office</strong>
                <address className="not-italic mt-2">
                    Floor 3, <br />
                    44 Montgomery St, <br />
                    San Francisco, CA, <br />
                    94104
                </address>
            </div>

            <div>
                <strong className="underline">UK Office</strong>
                <address className="not-italic mt-2">
                    Floor 4, <br />
                    City Launch Lab, <br />
                    124 Goswell Rd., <br />
                    Greater, London, <br />
                    EC1V 0DP
                </address>
            </div>
        </div>
    );
};

export default OurAddressSign;

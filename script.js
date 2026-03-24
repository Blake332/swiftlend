document.addEventListener('DOMContentLoaded', () => {
    const loanAmountSlider = document.getElementById('loan-amount');
    const loanDurationSlider = document.getElementById('loan-duration');
    const amountValue = document.getElementById('amount-value');
    const durationValue = document.getElementById('duration-value');
    const totalRepayment = document.getElementById('total-repayment');

    const interestRate = 0.12; // 12% flat interest for the demo

    function updateCalculator() {
        const amount = parseInt(loanAmountSlider.value);
        const duration = parseInt(loanDurationSlider.value);

        // Update UI labels
        amountValue.innerText = `Ksh ${amount.toLocaleString()}`;
        durationValue.innerText = `${duration} Days`;

        // Calculate interest (simple interest for demo)
        const interest = amount * interestRate;
        const total = amount + interest;

        // Update repayment amount
        totalRepayment.innerText = `Ksh ${total.toLocaleString()}`;
    }

    // Event listeners
    loanAmountSlider.addEventListener('input', updateCalculator);
    loanDurationSlider.addEventListener('input', updateCalculator);

    // Initial calculation
    updateCalculator();

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

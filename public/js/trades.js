// Handle trade completion
async function completeTrade(tradeId) {
    if (!confirm('Are you sure you want to complete this trade?')) {
        return;
    }

    try {
        const response = await fetch(`/trades/${tradeId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            M.toast({ html: data.message });
            
            // Show rating modal if rating info is provided
            if (data.ratingInfo) {
                showRatingModal(data.ratingInfo);
            }
            
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            M.toast({ html: data.error || 'Error completing trade' });
        }
    } catch (error) {
        console.error('Error:', error);
        M.toast({ html: 'Error completing trade' });
    }
} 
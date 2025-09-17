export const handleEmailPayslip = async (employeeId: string, month: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/email-payslip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, month }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert('Payslip emailed successfully!');
      } else {
        alert('Failed to send payslip: ' + data.error);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Error sending email: ' + err.message);
      } else {
        alert('Unknown error occurred');
      }
    }
  };
  
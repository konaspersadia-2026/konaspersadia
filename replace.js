const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationModal.tsx', 'utf8');

const target = `  const handleSelesai = async () => {
    const badgeElement = document.getElementById('badge-print-area');
    if (!badgeElement) return;

    try {
      // Create image from the badge element
      const imgData = await toPng(badgeElement, { pixelRatio: 3, backgroundColor: '#ffffff' });
      
      // A6 size in portrait is 105 x 148 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6'
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 105, 148);
      pdf.save(\`Badge-\${successData?.id}.pdf\`);
    } catch (error) {
      console.error('Error generating PDF', error);
    }
  };

  const handleClose = () => {
    if (step === 3) {
      resetForm();
    }
    onClose();
  };`;

const replacement = `  const handleSelesai = async () => {
    setIsDownloading(true);
    const badgeElement = document.getElementById('badge-print-area');
    if (badgeElement) {
      try {
        const imgData = await toPng(badgeElement, { pixelRatio: 3, backgroundColor: '#ffffff' });
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a6'
        });
        pdf.addImage(imgData, 'PNG', 0, 0, 105, 148);
        pdf.save(\`Badge-\${successData?.id}.pdf\`);
      } catch (error) {
        console.error('Error generating PDF', error);
      }
    }
    setIsDownloading(false);
    setShowThankYouPopup(true);
  };

  const handleClose = () => {
    if (step === 3 || showThankYouPopup) {
      resetForm();
    }
    onClose();
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/RegistrationModal.tsx', code);

const fs = require('fs');
let content = fs.readFileSync('src/components/RegistrationModal.tsx', 'utf8');

content = content.replace(
`  if (!isOpen) return null;

  return (
    <div
      id="registration-modal-overlay"`,
`  if (!isOpen) return null;

  return (
    <>
    <div
      id="registration-modal-overlay"`
);

content = content.replace(
`      {/* Hidden A6 Print Area for Badge */}
      {successData && (
        <div `,
`    {/* Hidden A6 Print Area for Badge */}
      {successData && (
        <div `
);

content = content.replace(
`            </div>
          </div>
        </div>
      )}

  );
}`,
`            </div>
          </div>
        </div>
      )}
    </>
  );
}`
);

fs.writeFileSync('src/components/RegistrationModal.tsx', content);

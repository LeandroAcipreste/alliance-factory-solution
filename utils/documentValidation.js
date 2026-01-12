/* -----------------------------------------
   CPF VALIDATION
----------------------------------------- */
function isValidCPF(cpf) {
    const clean = cpf.replace(/\D/g, "");

    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i)) * (10 - i);
    }

    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(clean.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(clean.charAt(i)) * (11 - i);
    }

    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(clean.charAt(10))) return false;

    return true;
}

/* -----------------------------------------
   CNPJ VALIDATION
----------------------------------------- */
function isValidCNPJ(cnpj) {
    const clean = cnpj.replace(/\D/g, "");

    if (clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(clean.charAt(i)) * weights1[i];
    }

    let rest = sum % 11;
    let digit1 = rest < 2 ? 0 : 11 - rest;
    if (digit1 !== parseInt(clean.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(clean.charAt(i)) * weights2[i];
    }

    rest = sum % 11;
    let digit2 = rest < 2 ? 0 : 11 - rest;
    if (digit2 !== parseInt(clean.charAt(13))) return false;

    return true;
}

/* -----------------------------------------
   DOCUMENT VALIDATION (CPF OR CNPJ)
----------------------------------------- */
function validateDocument(document) {
    const clean = document.replace(/\D/g, "");

    if (clean.length === 11) {
        if (!isValidCPF(clean)) {
            throw new Error("CPF Inválido.");
        }
        return { value: clean, type: "CPF" };
    }

    if (clean.length === 14) {
        if (!isValidCNPJ(clean)) {
            throw new Error("CNPJ inválido.");
        }
        return { value: clean, type: "CNPJ" };
    }

    throw new Error("CPF deve conter 11 e o CNPJ 14 dígitos.");
}

module.exports = {
    isValidCPF,
    isValidCNPJ,
    validateDocument
};

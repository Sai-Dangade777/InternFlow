import PDFDocument from "pdfkit";
import { Readable } from "stream";

/**
 * Generate Offer Letter PDF
 */
export const generateOfferLetterPdf = (candidateData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("Internship Offer Letter", {
        align: "center"
      });
      doc.moveDown();

      // Date
      doc.fontSize(10).font("Helvetica").text(`Date: ${new Date().toLocaleDateString()}`, {
        align: "right"
      });
      doc.moveDown();

      // Address
      doc.font("Helvetica").text("InternFlow Inc.", 50, doc.y);
      doc.text("123 Tech Boulevard");
      doc.text("Innovation City, IN 12345");
      doc.moveDown();

      // Recipient
      doc.text(`To: ${candidateData.name}`);
      doc.text(`Email: ${candidateData.email}`);
      doc.text(`Phone: ${candidateData.phone || "N/A"}`);
      doc.moveDown(2);

      // Subject
      doc.fontSize(12).font("Helvetica-Bold").text("Subject: Internship Offer");
      doc.moveDown();

      // Body
      doc.fontSize(11).font("Helvetica");
      doc.text(
        `Dear ${candidateData.name},`
      );
      doc.moveDown();

      doc.text(
        `We are pleased to offer you an internship position at InternFlow Inc. This letter outlines the terms and conditions of your internship.`
      );
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Position Details:");
      doc.font("Helvetica");
      doc.text(`Position: Intern - ${candidateData.domain || "General"}`, { indent: 20 });
      doc.text(`Duration: ${candidateData.internshipDurationWeeks || 8} weeks`, { indent: 20 });
      doc.text(
        `Start Date: ${candidateData.internshipStartDate ? new Date(candidateData.internshipStartDate).toLocaleDateString() : "To be determined"}`,
        { indent: 20 }
      );
      doc.text(
        `Joining Location: ${candidateData.joiningLocation || "Main Office"}`,
        { indent: 20 }
      );
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Responsibilities:");
      doc.font("Helvetica");
      doc.text("You will work under the supervision of your assigned mentor.", { indent: 20 });
      doc.text("Contribute to team projects and deliverables.", { indent: 20 });
      doc.text("Learn industry best practices and develop professional skills.", {
        indent: 20
      });
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Terms and Conditions:");
      doc.font("Helvetica");
      doc.text("This is an unpaid internship.", { indent: 20 });
      doc.text("You must maintain confidentiality of company information.", {
        indent: 20
      });
      doc.text("You are required to sign the NDA before commencement.", { indent: 20 });
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Next Steps:");
      doc.font("Helvetica");
      doc.text("1. Sign the attached NDA and return it to HR.", { indent: 20 });
      doc.text("2. Complete the joining form with required documents.", { indent: 20 });
      doc.text("3. Await IT access provisioning confirmation.", { indent: 20 });
      doc.moveDown(2);

      doc.text("Congratulations again, and we look forward to working with you!");
      doc.moveDown();

      doc.text("Sincerely,");
      doc.moveDown(2);

      doc.text("______________________");
      doc.text("InternFlow HR Team");
      doc.text("hr@internflow.demo");

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Internship Certificate PDF
 */
export const generateCertificatePdf = (candidateData, completionNote = "") => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Certificate border
      doc.rect(50, 50, 500, 650).stroke();
      doc.rect(55, 55, 490, 640).stroke();

      // Title
      doc.fontSize(32).font("Helvetica-Bold").text("Certificate of Internship", {
        align: "center",
        y: 80
      });

      // Decorative line
      doc.moveTo(150, 140).lineTo(400, 140).stroke();

      // Body
      doc.fontSize(14).font("Helvetica").moveDown(3);
      doc.text("This is to certify that", {
        align: "center"
      });

      doc.fontSize(18).font("Helvetica-Bold").text(candidateData.name, {
        align: "center"
      });

      doc.fontSize(14).font("Helvetica");
      doc.text("has successfully completed an internship program at", {
        align: "center"
      });

      doc.fontSize(16).font("Helvetica-Bold").text("InternFlow Inc.", {
        align: "center"
      });

      doc.moveDown();
      doc.fontSize(12).font("Helvetica");

      if (candidateData.internshipStartDate && candidateData.internshipEndDate) {
        doc.text(
          `from ${new Date(candidateData.internshipStartDate).toLocaleDateString()} to ${new Date(candidateData.internshipEndDate).toLocaleDateString()}`,
          {
            align: "center"
          }
        );
      }

      doc.moveDown();

      if (candidateData.domain) {
        doc.text(`Domain: ${candidateData.domain}`, {
          align: "center"
        });
      }

      if (candidateData.mentor?.name) {
        doc.text(`Mentor: ${candidateData.mentor.name}`, {
          align: "center"
        });
      }

      if (completionNote) {
        doc.moveDown();
        doc.text(`Performance Notes: ${completionNote}`, {
          align: "center"
        });
      }

      doc.moveDown(3);
      doc.fontSize(11).text(
        "The holder of this certificate has demonstrated commitment, professionalism, and technical competency.",
        {
          align: "center"
        }
      );

      // Signature area
      doc.moveDown(3);
      doc.text("_____________________", 100, doc.y);
      doc.text("Program Director", 100, doc.y + 20);

      doc.text("_____________________", 350, doc.y - 20);
      doc.text("Date", 350, doc.y + 20);

      // Footer
      doc.fontSize(10).text("InternFlow - Internship Management System", {
        align: "center",
        y: 720
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Internship Completion Letter PDF
 */
export const generateClosureLetterPdf = (candidateData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("Internship Completion Letter", {
        align: "center"
      });
      doc.moveDown();

      // Date
      doc.fontSize(10).font("Helvetica").text(`Date: ${new Date().toLocaleDateString()}`, {
        align: "right"
      });
      doc.moveDown();

      // Address
      doc.text("InternFlow Inc.", 50, doc.y);
      doc.text("123 Tech Boulevard");
      doc.text("Innovation City, IN 12345");
      doc.moveDown();

      // Recipient
      doc.text(`To: ${candidateData.name}`);
      doc.text(`Email: ${candidateData.email}`);
      doc.moveDown(2);

      // Subject
      doc.fontSize(12).font("Helvetica-Bold").text("Subject: Internship Completion & Closure");
      doc.moveDown();

      // Body
      doc.fontSize(11).font("Helvetica");
      doc.text(`Dear ${candidateData.name},`);
      doc.moveDown();

      doc.text(
        "This letter confirms that you have successfully completed your internship with InternFlow Inc."
      );
      doc.moveDown();

      doc.font("Helvetica-Bold").text("Internship Summary:");
      doc.font("Helvetica");
      doc.text(
        `Start Date: ${candidateData.lifecycle?.startDate ? new Date(candidateData.lifecycle.startDate).toLocaleDateString() : "N/A"}`,
        { indent: 20 }
      );
      doc.text(
        `End Date: ${candidateData.lifecycle?.endDate ? new Date(candidateData.lifecycle.endDate).toLocaleDateString() : "N/A"}`,
        { indent: 20 }
      );
      doc.text(`Domain: ${candidateData.domain || "General"}`, { indent: 20 });
      doc.text(`Mentor: ${candidateData.mentor?.name || "N/A"}`, { indent: 20 });
      doc.moveDown();

      doc.text(
        "Your internship access has been deactivated. Please return any company equipment or materials."
      );
      doc.moveDown();

      doc.text("We appreciate your contributions to the team and wish you success in your future endeavors.");
      doc.moveDown();

      doc.text("Sincerely,");
      doc.moveDown(2);

      doc.text("______________________");
      doc.text("InternFlow HR Team");

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

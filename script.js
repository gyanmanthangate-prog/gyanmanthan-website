// ================= FETCH COMPONENTS =================

// Header

fetch('./header.html')
  .then(res => res.text())
  .then(data => {

    const headerContainer = document.getElementById('header');

    if(headerContainer){
      headerContainer.innerHTML = data;
    }

    const menuToggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("nav");

    if (menuToggle && nav) {

      menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        menuToggle.classList.toggle("active");

        if (window.innerWidth <= 1190) {

          if (nav.style.height && nav.style.height !== "0px") {
            nav.style.height = "0px";
            nav.style.opacity = "0";
          } else {
            nav.style.height = nav.scrollHeight + "px";
            nav.style.opacity = "1";
          }

        }

      });

      // close menu when clicking outside
      document.addEventListener("click", (e) => {
        if (window.innerWidth <= 1190) {
          if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
            nav.style.height = "0px";
            nav.style.opacity = "0";
            menuToggle.classList.remove("active");
          }
        }
      });

      // reset on resize
      window.addEventListener("resize", () => {
        if (window.innerWidth > 1190) {
          nav.style.height = "";
          nav.style.opacity = "";
          menuToggle.classList.remove("active");
        }
      });

    }

});
//footer
fetch('footer.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('footer').innerHTML = data;
  });

  //Modal

const openBtn = document.getElementById("openForm");
const modal = document.getElementById("formModal");
const closeBtn = document.getElementById("closeForm");

if(openBtn && modal && closeBtn){
  openBtn.onclick = function() {
    modal.style.display = "flex";
  }

  closeBtn.onclick = function() {
    modal.style.display = "none";
  }
}

window.onclick = function(e) {
  if (e.target == modal) {
    modal.style.display = "none";
  }
}
window.onload = function() {

  if (!sessionStorage.getItem("modalShown")) {

    setTimeout(function() {
      modal.style.display = "flex";
      sessionStorage.setItem("modalShown", "true");
    }, 4000); // 4 sec delay

  }

}

  // WhatsApp
fetch('./whatsapp.html')
  .then(res => res.text())
  .then(data => {
    const div = document.createElement('div');
    div.innerHTML = data;
    document.body.appendChild(div);

    const closeBtn = document.querySelector('.tooltip-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeBtn.parentElement.style.display = 'none';
      });
    }
  });

// Back To Top
fetch('./backtotop.html')
  .then(res => res.text())
  .then(data => {
    const div = document.createElement('div');
    div.innerHTML = data;
    document.body.appendChild(div);

    const btn = document.getElementById("backToTop");

    window.addEventListener("scroll", () => {
      if (window.scrollY > 250) {
        btn.style.display = "block";
      } else {
        btn.style.display = "none";
      }
    });

    btn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  });


// ================= MENU TOGGLE =================



// ================= HEADER SHRINK =================

window.addEventListener("scroll", function(){

  const header = document.querySelector("header");

  if(header){
    if(window.scrollY > 80){
      header.classList.add("shrink");
    } else {
      header.classList.remove("shrink");
    }
  }

});


// ================= SCROLL REVEAL =================

const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  const windowHeight = window.innerHeight;

  reveals.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;

    if (sectionTop < windowHeight - 100) {
      section.classList.add("active");

      const cards = section.querySelectorAll(".card");
      cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.15}s`;
        card.classList.add("active-card");
      });
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);


// ================= FAQ ACCORDION =================

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
  const question = item.querySelector(".faq-question");

  if(question){
    question.addEventListener("click", () => {
      item.classList.toggle("active");
    });
  }
});


// ================= WHATSAPP FLOAT =================

window.addEventListener('scroll', () => {
  const btn = document.querySelector('.whatsapp-chat');
  if(btn){
    const scrollY = window.scrollY;
    btn.style.bottom = 40 + Math.sin(scrollY / 100) * 5 + 'px';
  }
});

// ========.   Download Brochure ============

const brochureBtn = document.getElementById("openBrochureForm");
const brochureModal = document.getElementById("brochureModal");
const closeBrochure = document.getElementById("closeBrochure");
const brochureForm = document.getElementById("brochureForm");

if (brochureBtn && brochureModal && closeBrochure && brochureForm) {

  brochureBtn.addEventListener("click", function(e) {
    e.preventDefault();
    brochureModal.style.display = "flex";
  });

  closeBrochure.addEventListener("click", function() {
    brochureModal.style.display = "none";
  });

  window.addEventListener("click", function(e) {
    if (e.target == brochureModal) brochureModal.style.display = "none";
  });

  brochureForm.addEventListener("submit", function(e) {
    e.preventDefault();

    if (!brochureForm.checkValidity()) {
      brochureForm.reportValidity();
      return;
    }

    const formData = new FormData(brochureForm);
    fetch("/", {
      method: "POST",
      body: formData
    })
    .then(() => {
      const link = document.createElement("a");
      link.href = "/assets/brochure.pdf";
      link.download = "GATE_ECE_Brochure.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      brochureModal.style.display = "none";
      brochureForm.reset();
    })
    .catch(() => alert("Form submission failed. Try again."));
  });

}


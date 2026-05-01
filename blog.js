 // Accordion
const accordions = document.querySelectorAll('.sidebar .accordion');
accordions.forEach(acc => {
  acc.addEventListener('click', () => {
    accordions.forEach(a => {
      if(a !== acc) a.classList.remove('active');
    });
    acc.classList.toggle('active');
  });
});


// Subtopic click loader
const subtopicLinks = document.querySelectorAll('.subtopics a');
const rightContent = document.getElementById('rightContent');


subtopicLinks.forEach(link => {
  link.addEventListener('click', async (e) => {

    const file = link.getAttribute('data-file');
    const id = link.getAttribute('data-id');

    if(file){
      e.preventDefault();

      const res = await fetch(file);
      const html = await res.text();

      rightContent.innerHTML = `
        <div class="blog-right reveal">
          ${html}
        </div>
      `;
    }

    else if(id){
      e.preventDefault();

      const content = window.subtopicData?.[id];

      if(!content){
        rightContent.innerHTML = `<p>Content not found.</p>`;
        return;
      }

      rightContent.innerHTML = `
        <div class="blog-right reveal">
          <h4>${link.textContent}</h4>
          ${content}
        </div>
      `;
    }

    const revealEl = rightContent.querySelector('.reveal');
    if(revealEl){
      setTimeout(()=> revealEl.classList.add('active'),50);
    }

    if(window.innerWidth <= 768){
  document.getElementById('sidebar')?.classList.remove('show');
  document.getElementById('hamburger')?.classList.remove('active');
}

  });
});

fetch('/sidebar.html')
  .then(res => res.text())
  .then(data => {

    document.getElementById('sidebar-component').innerHTML = data;

    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');

    // 🔹 Accordion logic
    const accordions = sidebar.querySelectorAll('.accordion');

    accordions.forEach(acc => {
      acc.addEventListener('click', () => {

        accordions.forEach(a => {
          if(a !== acc) a.classList.remove('active');
        });

        acc.classList.toggle('active');

      });
    });

  });

  document.addEventListener('click', (e) => {

  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');

  if(!sidebar || !hamburger) return;

  // hamburger click
  if(hamburger.contains(e.target)){

    sidebar.classList.toggle('show');
    hamburger.classList.toggle('active');
    return;

  }

  // outside click close
  if(window.innerWidth <= 768){

    if(!sidebar.contains(e.target)){

      sidebar.classList.remove('show');
      hamburger.classList.remove('active');

    }

  }

});
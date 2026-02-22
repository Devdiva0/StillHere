import os
import re

files_to_update = ['index.html', 'join.html', 'problem.html', 'solution.html', 'tables.html', 'profile.html', 'moments.html', 'about.html']

def generate_sidebar(active_page):
    def is_active(page):
        return 'active' if page == active_page else ''
    
    return f'''    <!-- Side Navigation -->
    <aside class="side-nav">
        <div class="logo">
            <a href="index.html" class="logo-link">
                <span class="logo-icon material-symbols-outlined">spa</span>
                <span class="logo-text">StillHere</span>
            </a>
        </div>
        <nav>
            <a href="index.html" class="nav-item {is_active('Home')}"><span class="material-symbols-outlined">home</span> <span class="nav-label">Home</span></a>
            <a href="problem.html" class="nav-item {is_active('Problem')}"><span class="material-symbols-outlined">psychology</span> <span class="nav-label">Problem</span></a>
            <a href="solution.html" class="nav-item {is_active('Solution')}"><span class="material-symbols-outlined">spa</span> <span class="nav-label">Solution</span></a>
            <a href="tables.html" class="nav-item {is_active('Tables')}"><span class="material-symbols-outlined">groups</span> <span class="nav-label">Rooms</span></a>
            <a href="moments.html" class="nav-item {is_active('Moments')}"><span class="material-symbols-outlined">chat_bubble</span> <span class="nav-label">Moments</span></a>
            <a href="join.html" class="nav-item {is_active('Join')}"><span class="material-symbols-outlined">add_circle</span> <span class="nav-label">Waitlist</span></a>
            <a href="profile.html" class="nav-item nav-profile-link {is_active('Profile')}" title="Profile">
                <div class="nav-avatar" style="background: #39b59e;">🦊</div>
                <span class="nav-label">Profile</span>
            </a>
            <a href="about.html" class="nav-item {is_active('About')}"><span class="material-symbols-outlined">info</span> <span class="nav-label">About</span></a>
        </nav>
    </aside>'''

active_map = {
    'index.html': 'Home',
    'problem.html': 'Problem',
    'solution.html': 'Solution',
    'tables.html': 'Tables',
    'moments.html': 'Moments',
    'join.html': 'Join',
    'profile.html': 'Profile',
    'about.html': 'About'
}

for filename in files_to_update:
    if not os.path.exists(filename):
        continue
        
    with open(filename, 'r') as f:
        content = f.read()

    # Find the header navigation block and replace it
    # <aside class="side-nav">...</aside>
    pattern = re.compile(r'<!--\s*Side Navigation\s*-->\s*<aside class="side-nav">.*?</aside>', re.DOTALL)
    
    new_sidebar = generate_sidebar(active_map.get(filename))
    
    new_content = pattern.sub(new_sidebar, content)

    with open(filename, 'w') as f:
        f.write(new_content)

print("Updated sidebar HTML for icon swap.")

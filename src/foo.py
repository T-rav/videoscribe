import requests
from bs4 import BeautifulSoup

def download_podcast(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find the audio source link (this might vary depending on how Apple Podcasts structures the page)
    audio_url = None
    for link in soup.find_all('a'):
        href = link.get('href')
        if href and href.endswith('.mp3'):  # or any other audio format
            audio_url = href
            break

    if audio_url:
        audio_response = requests.get(audio_url)
        filename = audio_url.split('/')[-1]
        with open(filename, 'wb') as f:
            f.write(audio_response.content)
        print(f'Download complete: {filename}')
    else:
        print('Audio file not found.')

podcast_url = 'https://podcasts.apple.com/us/podcast/biden-leaves-the-stage/id1200361736?i=1000665985607'
download_podcast(podcast_url)


import os
import re
import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = "release_notes_cache.xml"
CACHE_DURATION = 3600  # Cache for 1 hour

def fetch_feed_xml(force_refresh=False):
    """Fetches the release notes feed, using cache if available and fresh."""
    # Check if cached file exists and is fresh
    if not force_refresh and os.path.exists(CACHE_FILE):
        file_age = time.time() - os.path.getmtime(CACHE_FILE)
        if file_age < CACHE_DURATION:
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                app.logger.warning(f"Error reading cache file: {e}")

    # Fetch from network
    try:
        response = requests.get(FEED_URL, timeout=10)
        if response.status_code == 200:
            xml_data = response.text
            # Write to cache
            try:
                with open(CACHE_FILE, "w", encoding="utf-8") as f:
                    f.write(xml_data)
            except Exception as e:
                app.logger.error(f"Error writing to cache file: {e}")
            return xml_data
        else:
            app.logger.error(f"Failed to fetch feed. Status code: {response.status_code}")
    except Exception as e:
        app.logger.error(f"Error fetching feed: {e}")

    # Fallback to expired cache if network fails
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            app.logger.error(f"Error reading expired cache fallback: {e}")
            
    return None

def parse_release_notes(feed_xml):
    """Parses the XML feed and splits entry HTML content into individual update items."""
    if not feed_xml:
        return []

    try:
        root = ET.fromstring(feed_xml.encode('utf-8'))
    except Exception as e:
        app.logger.error(f"XML Parsing Error: {e}")
        return []

    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    updates = []
    
    # We iterate over entries in the feed
    for entry in root.findall('atom:entry', ns):
        date_str = entry.find('atom:title', ns).text
        updated_iso = entry.find('atom:updated', ns).text
        
        # Format updated_iso to a cleaner string if needed
        # e.g., 2026-06-15T00:00:00-07:00 -> 2026-06-15
        short_date = updated_iso.split('T')[0] if 'T' in updated_iso else updated_iso

        link_elem = entry.find('atom:link', ns)
        link = link_elem.attrib.get('href') if link_elem is not None else ""
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        # Split by <h3>...</h3> tags to extract separate updates
        # e.g., <h3>Feature</h3> ... <h3>Fix</h3> ...
        parts = re.split(r'(<h3>.*?</h3>)', content_html)
        
        if len(parts) <= 1:
            # No h3 tags, treat the whole content as one item
            clean_content = content_html.strip()
            update_id = f"{short_date}-general-{hash(clean_content) & 0xffffffff}"
            updates.append({
                'id': update_id,
                'date': date_str,
                'short_date': short_date,
                'type': 'General',
                'content': clean_content,
                'link': link
            })
            continue

        # If there are h3 tags, we process them in pairs
        # parts[0] is content before first h3 (usually empty or whitespace)
        # parts[1] is <h3>Feature</h3>
        # parts[2] is the HTML content following it
        for i in range(1, len(parts), 2):
            header_html = parts[i]
            body_html = parts[i+1] if (i+1) < len(parts) else ""
            
            # Clean header text (remove HTML tags)
            type_text = re.sub(r'<[^>]+>', '', header_html).strip()
            
            # Clean body content
            body_content = body_html.strip()
            
            # Create a unique ID for indexing/selection
            update_id = f"{short_date}-{type_text.lower()}-{hash(body_content) & 0xffffffff}"
            
            updates.append({
                'id': update_id,
                'date': date_str,
                'short_date': short_date,
                'type': type_text,
                'content': body_content,
                'link': link
            })

    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    xml_data = fetch_feed_xml(force_refresh=force_refresh)
    if not xml_data:
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve release notes feed.'
        }), 500
        
    updates = parse_release_notes(xml_data)
    
    # Extract unique categories for filtering
    types = list(set(update['type'] for update in updates))
    
    return jsonify({
        'success': True,
        'updates': updates,
        'types': sorted(types),
        'last_updated': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(os.path.getmtime(CACHE_FILE))) if os.path.exists(CACHE_FILE) else 'N/A'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

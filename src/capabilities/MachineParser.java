// src/capabilities/MachineParser.java
// MachineParser
// A structural + semantic parser for machine-readable specs (JSON-like).
// Goal: turn raw config/manifests into a normalized virtual-object graph
// that Javaspectre can introspect, score, and route.
//
// Features:
// - Parse JSON strings into a generic Node tree
// - Infer primitive vs object vs array vs "virtual object" (id/type/hints)
// - Emit a flat list of MachineObject definitions with paths and metadata

package capabilities;

import java.util.*;

public class MachineParser {

    public enum NodeKind {
        NULL, BOOLEAN, NUMBER, STRING, ARRAY, OBJECT
    }

    public static final class Node {
        public final NodeKind kind;
        public final Object value;

        public Node(NodeKind kind, Object value) {
            this.kind = kind;
            this.value = value;
        }

        @SuppressWarnings("unchecked")
        public Map<String, Node> asObject() {
            return kind == NodeKind.OBJECT ? (Map<String, Node>) value : Map.of();
        }

        @SuppressWarnings("unchecked")
        public List<Node> asArray() {
            return kind == NodeKind.ARRAY ? (List<Node>) value : List.of();
        }
    }

    public static final class MachineObject {
        public final String id;
        public final String path;
        public final String type;
        public final Map<String, Object> attributes;

        public MachineObject(String id, String path, String type, Map<String, Object> attributes) {
            this.id = id;
            this.path = path;
            this.type = type;
            this.attributes = attributes;
        }

        @Override
        public String toString() {
            return "MachineObject{" +
                    "id='" + id + '\'' +
                    ", path='" + path + '\'' +
                    ", type='" + type + '\'' +
                    ", attributes=" + attributes +
                    '}';
        }
    }

    public static final class ParseResult {
        public final Node root;
        public final List<MachineObject> objects;

        public ParseResult(Node root, List<MachineObject> objects) {
            this.root = root;
            this.objects = objects;
        }
    }

    // -------- Simple JSON-ish parser (minimal, no external deps) --------

    public Node parseJson(String json) {
        return new MiniJsonParser(json).parse();
    }

    public ParseResult extractMachineObjects(Node root) {
        List<MachineObject> objects = new ArrayList<>();
        walk(root, "root", objects);
        return new ParseResult(root, objects);
    }

    private void walk(Node node, String path, List<MachineObject> out) {
        switch (node.kind) {
            case OBJECT -> {
                Map<String, Node> map = node.asObject();
                boolean looksLikeVirtual =
                        map.containsKey("id") ||
                        map.containsKey("name") ||
                        map.containsKey("type");

                if (looksLikeVirtual) {
                    String id = getString(map.get("id"), path);
                    String type = getString(map.get("type"), inferTypeFromPath(path));
                    Map<String, Object> attrs = new LinkedHashMap<>();
                    for (Map.Entry<String, Node> e : map.entrySet()) {
                        attrs.put(e.getKey(), renderLeaf(e.getValue()));
                    }
                    out.add(new MachineObject(id, path, type, attrs));
                }

                for (Map.Entry<String, Node> e : map.entrySet()) {
                    walk(e.getValue(), path + "." + e.getKey(), out);
                }
            }
            case ARRAY -> {
                List<Node> list = node.asArray();
                for (int i = 0; i < list.size(); i++) {
                    walk(list.get(i), path + "[" + i + "]", out);
                }
            }
            default -> {
            }
        }
    }

    private String getString(Node node, String fallback) {
        if (node == null || node.kind != NodeKind.STRING) return fallback;
        return (String) node.value;
    }

    private String inferTypeFromPath(String path) {
        if (path.contains("service")) return "service";
        if (path.contains("node")) return "node";
        if (path.contains("task")) return "task";
        return "virtual-object";
    }

    private Object renderLeaf(Node node) {
        return switch (node.kind) {
            case NULL -> null;
            case BOOLEAN, NUMBER, STRING -> node.value;
            case ARRAY -> "[array]";
            case OBJECT -> "{object}";
        };
    }

    // -------- Mini JSON parser (very limited but sufficient for configs) --------

    private static final class MiniJsonParser {
        private final String s;
        private int pos = 0;

        MiniJsonParser(String s) {
            this.s = s;
        }

        Node parse() {
            skipWs();
            Node v = parseValue();
            skipWs();
            return v;
        }

        private Node parseValue() {
            skipWs();
            if (pos >= s.length()) {
                return new Node(NodeKind.NULL, null);
            }
            char c = s.charAt(pos);
            return switch (c) {
                case '{' -> parseObject();
                case '[' -> parseArray();
                case '"', '\'' -> parseString();
                case 't', 'f' -> parseBoolean();
                case 'n' -> parseNull();
                default -> parseNumber();
            };
        }

        private Node parseObject() {
            expect('{');
            Map<String, Node> map = new LinkedHashMap<>();
            skipWs();
            if (peek() == '}') {
                pos++;
                return new Node(NodeKind.OBJECT, map);
            }
            while (true) {
                skipWs();
                Node keyNode = parseString();
                String key = (String) keyNode.value;
                skipWs();
                expect(':');
                skipWs();
                Node value = parseValue();
                map.put(key, value);
                skipWs();
                char c = peek();
                if (c == ',') {
                    pos++;
                    continue;
                } else if (c == '}') {
                    pos++;
                    break;
                } else {
                    break;
                }
            }
            return new Node(NodeKind.OBJECT, map);
        }

        private Node parseArray() {
            expect('[');
            List<Node> list = new ArrayList<>();
            skipWs();
            if (peek() == ']') {
                pos++;
                return new Node(NodeKind.ARRAY, list);
            }
            while (true) {
                skipWs();
                Node v = parseValue();
                list.add(v);
                skipWs();
                char c = peek();
                if (c == ',') {
                    pos++;
                    continue;
                } else if (c == ']') {
                    pos++;
                    break;
                } else {
                    break;
                }
            }
            return new Node(NodeKind.ARRAY, list);
        }

        private Node parseString() {
            char quote = s.charAt(pos);
            if (quote != '"' && quote != '\'') quote = '"';
            if (s.charAt(pos) == '"' || s.charAt(pos) == '\'') pos++;
            StringBuilder sb = new StringBuilder();
            while (pos < s.length()) {
                char c = s.charAt(pos++);
                if (c == quote) break;
                if (c == '\\' && pos < s.length()) {
                    char esc = s.charAt(pos++);
                    sb.append(esc);
                } else {
                    sb.append(c);
                }
            }
            return new Node(NodeKind.STRING, sb.toString());
        }

        private Node parseBoolean() {
            if (s.startsWith("true", pos)) {
                pos += 4;
                return new Node(NodeKind.BOOLEAN, Boolean.TRUE);
            } else if (s.startsWith("false", pos)) {
                pos += 5;
                return new Node(NodeKind.BOOLEAN, Boolean.FALSE);
            }
            return new Node(NodeKind.BOOLEAN, Boolean.FALSE);
        }

        private Node parseNull() {
            if (s.startsWith("null", pos)) {
                pos += 4;
            }
            return new Node(NodeKind.NULL, null);
        }

        private Node parseNumber() {
            int start = pos;
            while (pos < s.length()) {
                char c = s.charAt(pos);
                if ((c >= '0' && c <= '9') || c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E') {
                    pos++;
                } else {
                    break;
                }
            }
            String token = s.substring(start, pos).trim();
            try {
                if (token.contains(".") || token.contains("e") || token.contains("E")) {
                    return new Node(NodeKind.NUMBER, Double.parseDouble(token));
                } else {
                    return new Node(NodeKind.NUMBER, Long.parseLong(token));
                }
            } catch (NumberFormatException e) {
                return new Node(NodeKind.STRING, token);
            }
        }

        private void skipWs() {
            while (pos < s.length()) {
                char c = s.charAt(pos);
                if (c == ' ' || c == '\n' || c == '\r' || c == '\t') pos++;
                else break;
            }
        }

        private void expect(char c) {
            if (pos < s.length() && s.charAt(pos) == c) {
                pos++;
            }
        }

        private char peek() {
            if (pos >= s.length()) return '\0';
            return s.charAt(pos);
        }
    }

    // Simple demo
    public static void main(String[] args) {
        String json = """
          {
            "service": {
              "id": "api-gateway",
              "type": "gateway",
              "replicas": 3,
              "endpoints": [
                { "id": "public", "path": "/api" },
                { "id": "internal", "path": "/internal" }
              ]
            }
          }
        """;

        MachineParser parser = new MachineParser();
        Node root = parser.parseJson(json);
        ParseResult result = parser.extractMachineObjects(root);

        System.out.println("Discovered objects:");
        for (MachineObject o : result.objects) {
            System.out.println(o);
        }
    }
}

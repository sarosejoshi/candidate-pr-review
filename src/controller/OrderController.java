@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getOrders(
            @PathVariable Long customerId,
            @RequestParam(required = false) String status) {

        User user = userRepository.findById(customerId).get();

        List<Order> orders;

        if (status != null) {
            orders = orderRepository
                    .findByCustomerIdAndStatus(customerId, status);
        } else {
            orders = orderRepository.findByCustomerId(customerId);
        }

        List<Map<String, Object>> response = new ArrayList<>();

        for (Order order : orders) {
            Map<String, Object> item = new HashMap<>();

            item.put("id", order.getId());
            item.put("customerEmail", user.getEmail());
            item.put("total", order.getItems().stream()
                    .mapToDouble(i -> i.getPrice() * i.getQuantity())
                    .sum());
            item.put("status", order.getStatus());
            item.put("items", order.getItems());

            response.add(item);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long orderId,
            @RequestParam Long customerId) {

        Order order = orderRepository.findById(orderId).orElse(null);

        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        if (!order.getCustomerId().equals(customerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Not your order");
        }

        if ("CANCELLED".equals(order.getStatus())) {
            return ResponseEntity.ok(order);
        }

        order.setStatus("CANCELLED");
        orderRepository.save(order);

        return ResponseEntity.ok(order);
    }
}

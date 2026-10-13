package com.billingsystem.business;

import com.billingsystem.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.HashMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "businesses")
@Getter
@Setter
public class Business extends BaseEntity {

  @Column(nullable = false)
  private String name;

  private String gstin;

  private String email;

  private String phone;

  @Column(columnDefinition = "text")
  private String address;

  /** Used to determine CGST+SGST (intra-state) vs IGST (inter-state) on invoices. */
  private String state;

  /** Default currency / locale, invoice numbering format, enabled modules, logo, invoice terms, etc. */
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> settings = new HashMap<>();
}
